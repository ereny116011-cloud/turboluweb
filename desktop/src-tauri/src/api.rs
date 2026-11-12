//! Worker API istemcisi.
//!
//! Yalnızca izin listesindeki uçlara istek yapılabilir; renderer'dan gelen
//! yol ve yöntem `API_ROUTES` tablosuna karşı doğrulanır. Keyfî adres çağrısı
//! mümkün değildir.

use std::collections::HashMap;
use std::time::Duration;

use serde::{Deserialize, Serialize};

pub const API_BASE: &str = "https://shrill-salad-a498.ereny116011.workers.dev";

/// Uçlar ve izin verilen yöntemler.
type RouteTable = HashMap<&'static str, &'static [&'static str]>;

/// Yanıt ve istek boyutları için üst sınırlar.
const MAX_API_BYTES: usize = 4 * 1024 * 1024;
const MAX_REQUEST_BYTES: usize = 3 * 1024 * 1024;

/// Çağrılabilecek yollar ve yöntemler.
fn api_routes() -> RouteTable {
    let mut routes = HashMap::new();
    routes.insert("/api/login", &["POST"][..]);
    routes.insert("/api/register", &["POST"][..]);
    routes.insert("/api/auth/oauth/providers", &["GET"][..]);
    routes.insert("/api/auth/oauth/exchange", &["POST"][..]);
    routes.insert("/api/profile", &["GET", "PUT"][..]);
    routes.insert("/api/items", &["GET"][..]);
    routes.insert("/api/buy", &["POST"][..]);
    routes.insert("/api/inventory", &["GET"][..]);
    routes.insert("/api/announcements", &["GET"][..]);
    routes.insert("/api/news", &["GET"][..]);
    routes.insert("/api/campaigns", &["GET"][..]);
    routes.insert("/api/child-gifts", &["GET"][..]);
    routes.insert("/api/admin/users", &["GET"][..]);
    routes.insert("/api/admin/requests", &["GET"][..]);
    routes.insert("/api/admin/ban-user", &["POST"][..]);
    routes.insert("/api/admin/unban-user", &["POST"][..]);
    routes.insert("/api/admin/delete-user", &["POST"][..]);
    routes.insert("/api/admin/complete-request", &["POST"][..]);
    routes.insert("/api/admin/reject-request", &["POST"][..]);
    routes.insert("/api/admin/announcement", &["POST", "DELETE"][..]);
    routes.insert("/api/admin/news", &["POST", "DELETE"][..]);
    routes.insert("/api/admin/campaign", &["POST", "DELETE"][..]);
    routes.insert("/api/admin/item", &["POST"][..]);
    routes.insert("/api/admin/child-gifts", &["GET"][..]);
    routes.insert("/api/admin/child-gift", &["POST", "DELETE"][..]);
    routes.insert("/api/admin/child-gift/publish", &["POST"][..]);
    routes
}

/// Renderer'ın gönderdiği istek gövdesi.
#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiPayload {
    #[serde(default)]
    pub path: String,
    #[serde(default)]
    pub method: String,
    #[serde(default)]
    pub query: Option<HashMap<String, String>>,
    #[serde(default)]
    pub body: Option<serde_json::Value>,
    /// `false` ise oturum token'ı eklenmez (kayıt/giriş gibi açık uçlar).
    #[serde(default)]
    pub auth: Option<bool>,
}

/// Renderer'a dönen yanıt.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiResponse {
    pub ok: bool,
    pub status: u16,
    pub data: serde_json::Value,
}

impl ApiResponse {
    fn hata(status: u16, mesaj: &str) -> Self {
        Self {
            ok: false,
            status,
            data: serde_json::json!({ "error": mesaj }),
        }
    }
}

/// Sorgu dizesinde yalnızca izin verilen anahtar geçer.
fn sanitize_query(query: &Option<HashMap<String, String>>) -> Vec<(String, String)> {
    let mut pairs = Vec::new();
    if let Some(map) = query {
        for (key, value) in map {
            if key == "platform" {
                let v = value.trim();
                if matches!(v, "java" | "bedrock" | "all" | "portal") {
                    pairs.push((key.clone(), v.to_string()));
                }
            }
        }
    }
    pairs
}

/// API'ye istek yapar.
pub async fn call_api(
    client: &reqwest::Client,
    session_token: &str,
    payload: ApiPayload,
) -> ApiResponse {
    let route = payload.path.trim();
    let method = payload.method.trim().to_uppercase();

    let routes = api_routes();
    let allowed = match routes.get(route) {
        Some(methods) => *methods,
        None => return ApiResponse::hata(400, "Geçersiz istek."),
    };
    if !allowed.contains(&method.as_str()) {
        return ApiResponse::hata(400, "Geçersiz istek.");
    }

    let mut url = format!("{API_BASE}{route}");
    let query = sanitize_query(&payload.query);
    if !query.is_empty() {
        let mut separator = '?';
        for (key, value) in &query {
            url.push(separator);
            url.push_str(&urlencode(key));
            url.push('=');
            url.push_str(&urlencode(value));
            separator = '&';
        }
    }

    let mut request = client.request(
        reqwest::Method::from_bytes(method.as_bytes()).unwrap_or(reqwest::Method::GET),
        &url,
    );
    request = request.header("Accept", "application/json");

    if payload.auth != Some(false) && !session_token.is_empty() {
        request = request.header("Authorization", format!("Bearer {session_token}"));
    }

    if let Some(body) = payload.body {
        if !body.is_null() {
            let text = match serde_json::to_string(&body) {
                Ok(text) => text,
                Err(_) => return ApiResponse::hata(400, "Geçersiz istek gövdesi."),
            };
            if text.len() > MAX_REQUEST_BYTES {
                return ApiResponse::hata(400, "İstek gövdesi çok büyük.");
            }
            request = request
                .header("Content-Type", "application/json")
                .body(text);
        }
    }

    let response = match request.send().await {
        Ok(response) => response,
        Err(error) => {
            let mesaj = if error.is_timeout() {
                "Sunucu yanıt vermedi. Bağlantını kontrol et."
            } else {
                "Sunucuya ulaşılamadı."
            };
            return ApiResponse::hata(0, mesaj);
        }
    };

    let status = response.status().as_u16();

    // Büyük/yanıltıcı yanıtlarla belleği tüketmeyi engelle.
    if let Some(declared) = response.content_length() {
        if declared as usize > MAX_API_BYTES {
            return ApiResponse::hata(0, "Sunucu yanıtı çok büyük.");
        }
    }

    let bytes = match response.bytes().await {
        Ok(bytes) => bytes,
        Err(_) => return ApiResponse::hata(0, "Sunucuya ulaşılamadı."),
    };
    if bytes.len() > MAX_API_BYTES {
        return ApiResponse::hata(0, "Sunucu yanıtı çok büyük.");
    }

    let data = if bytes.is_empty() {
        serde_json::Value::Object(Default::default())
    } else {
        serde_json::from_slice(&bytes).unwrap_or(serde_json::Value::Object(Default::default()))
    };

    ApiResponse {
        ok: (200..300).contains(&status),
        status,
        data,
    }
}

/// Sorgu dizesi için yüzde kodlama.
fn urlencode(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for byte in value.as_bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(*byte as char);
            }
            other => out.push_str(&format!("%{other:02X}")),
        }
    }
    out
}

/// HTTP istemcisi.
pub fn http_client() -> reqwest::Client {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .user_agent(concat!("TurboluApp/", env!("CARGO_PKG_VERSION")))
        .build()
        .unwrap_or_default()
}
