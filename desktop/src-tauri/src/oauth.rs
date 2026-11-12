//! Sosyal giriş için yerel köprü.
//!
//! Sağlayıcı sayfası sistem tarayıcısında açılır. Dönüş adresi olarak yalnızca
//! bu makinede çalışan geçici bir dinleyici kullanılır; kod tarayıcıdan
//! uygulamaya köprü üzerinden geçer.

use std::io::{BufRead, BufReader, Read, Write};
use std::net::{Ipv4Addr, SocketAddr, TcpListener};
use std::sync::mpsc;
use std::time::Duration;

use rand::RngCore;

pub const OAUTH_PROVIDERS: [&str; 4] = ["github", "google", "microsoft", "xbox"];
pub const OAUTH_TIMEOUT: Duration = Duration::from_secs(5 * 60);

/// Köprüden dönen sonuç.
#[derive(Debug, Clone)]
pub struct OAuthResult {
    pub ok: bool,
    pub code: Option<String>,
    pub error: Option<String>,
}

impl OAuthResult {
    fn success(code: String) -> Self {
        Self { ok: true, code: Some(code), error: None }
    }

    fn failure(message: impl Into<String>) -> Self {
        Self { ok: false, code: None, error: Some(message.into()) }
    }
}

/// Rastgele tek kullanımlık yol.
fn nonce() -> String {
    let mut bytes = [0u8; 18];
    rand::thread_rng().fill_bytes(&mut bytes);
    hex::encode(bytes)
}

/// HTML kaçışı.
fn escape_html(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for ch in value.chars() {
        match ch {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&#39;"),
            other => out.push(other),
        }
    }
    out
}

/// Tarayıcıda gösterilen sonuç sayfası.
fn result_page(ok: bool, message: &str) -> String {
    let title = if ok { "Giriş tamamlandı" } else { "Giriş tamamlanamadı" };
    let detail = escape_html(if message.is_empty() {
        if ok {
            "Tarayıcıyı kapatıp TurboluApp'e dönebilirsin."
        } else {
            "Uygulamaya dönüp yeniden deneyebilirsin."
        }
    } else {
        message
    });

    format!(
        r#"<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title_esc} — TurboluApp</title>
  <style>
    :root {{ color-scheme: dark; }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      padding: 24px; background: #0b101d; color: #e9eefb;
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    }}
    .card {{
      width: min(420px, 100%); padding: 34px 30px; text-align: center;
      border: 1px solid rgba(255,255,255,.1); border-radius: 18px;
      background: #111726; box-shadow: 0 24px 70px rgba(0,0,0,.45);
    }}
    .mark {{
      width: 52px; height: 52px; margin: 0 auto 18px; display: grid;
      place-items: center; border-radius: 50%;
      background: {mark_bg}; color: {mark_fg}; font-size: 26px;
    }}
    h1 {{ margin: 0 0 10px; font-size: 21px; font-weight: 650; letter-spacing: -.01em; }}
    p {{ margin: 0; color: #93a1bb; font-size: 14px; line-height: 1.6; }}
    .hint {{ margin-top: 18px; font-size: 12px; color: #6b7897; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="mark">{mark}</div>
    <h1>{title_esc}</h1>
    <p>{detail}</p>
    <p class="hint">Bu sekmeyi kapatabilirsin.</p>
  </div>
  <script>if ({script_true}) {{ setTimeout(function () {{ window.close(); }}, 900); }}</script>
</body>
</html>"#,
        title_esc = escape_html(title),
        detail = detail,
        mark = if ok { "✓" } else { "!" },
        mark_bg = if ok { "rgba(74,222,128,.14)" } else { "rgba(248,113,113,.14)" },
        mark_fg = if ok { "#4ade80" } else { "#f87171" },
        script_true = ok,
    )
}

/// Dönüş adresinden kod veya hata mesajını ayıklar.
fn parse_callback(target: &str) -> (Option<String>, String) {
    let mut code = None;
    let mut message = String::new();

    if let Some(query) = target.split('?').nth(1) {
        for pair in query.split('&') {
            let mut parts = pair.splitn(2, '=');
            let key = parts.next().unwrap_or("");
            let value = parts.next().unwrap_or("");
            let value = percent_decode(value);
            match key {
                "code" if !value.is_empty() => code = Some(value),
                "message" => message = value,
                _ => {}
            }
        }
    }

    (code, message)
}

/// Yüzde çözme.
fn percent_decode(value: &str) -> String {
    let bytes = value.as_bytes();
    let mut out: Vec<u8> = Vec::with_capacity(bytes.len());
    let mut index = 0;
    while index < bytes.len() {
        match bytes[index] {
            b'%' if index + 2 < bytes.len() => {
                let hex_part = &value[index + 1..index + 3];
                match u8::from_str_radix(hex_part, 16) {
                    Ok(byte) => {
                        out.push(byte);
                        index += 3;
                    }
                    Err(_) => {
                        out.push(bytes[index]);
                        index += 1;
                    }
                }
            }
            b'+' => {
                out.push(b' ');
                index += 1;
            }
            other => {
                out.push(other);
                index += 1;
            }
        }
    }
    String::from_utf8_lossy(&out).into_owned()
}

/// Yerel dinleyiciyi başlatır ve dönüş adresini döndürür.
pub fn start_bridge(provider: &str) -> Result<(String, mpsc::Receiver<OAuthResult>), String> {
    if !OAUTH_PROVIDERS.contains(&provider) {
        return Err("Bilinmeyen giriş yöntemi.".to_string());
    }

    let listener = TcpListener::bind(SocketAddr::from((Ipv4Addr::LOCALHOST, 0)))
        .map_err(|_| "Yerel giriş köprüsü açılamadı.".to_string())?;

    let port = listener
        .local_addr()
        .map_err(|_| "Yerel giriş köprüsü açılamadı.".to_string())?
        .port();

    let token = nonce();
    let path = format!("/oauth/{token}");
    let redirect_uri = format!("http://127.0.0.1:{port}{path}");

    let (sender, receiver) = mpsc::channel();

    std::thread::spawn(move || {
        // Yalnızca tek bir geri dönüş beklenir; sonrasında dinleyici kapanır.
        listener
            .set_nonblocking(false)
            .ok();

        if let Ok((mut stream, _)) = listener.accept() {
            let mut request_line = String::new();
            let mut reader = BufReader::new(stream.try_clone().unwrap_or_else(|_| stream.try_clone().unwrap()));

            // İstek satırı ve başlıklar okunur.
            if reader.read_line(&mut request_line).is_ok() {
                let target = request_line.split_whitespace().nth(1).unwrap_or("").to_string();

                let mut content_length = 0usize;
                loop {
                    let mut header = String::new();
                    if reader.read_line(&mut header).is_err() {
                        break;
                    }
                    let trimmed = header.trim_end();
                    if trimmed.is_empty() {
                        break;
                    }
                    if let Some(value) = trimmed
                        .split_once(':')
                        .filter(|(name, _)| name.eq_ignore_ascii_case("content-length"))
                        .map(|(_, value)| value.trim().to_string())
                    {
                        content_length = value.parse().unwrap_or(0);
                    }
                }

                if content_length > 0 {
                    let mut body = vec![0u8; content_length.min(64 * 1024)];
                    let _ = reader.read_exact(&mut body);
                }

                let (code, message) = parse_callback(&target);
                let ok = code.is_some();
                let page = result_page(ok, &message);

                let status = if ok { "200 OK" } else { "400 Bad Request" };
                let response = format!(
                    "HTTP/1.1 {status}\r\n\
                     Content-Type: text/html; charset=utf-8\r\n\
                     Cache-Control: no-store\r\n\
                     X-Content-Type-Options: nosniff\r\n\
                     Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; \
                     script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'\r\n\
                     Content-Length: {len}\r\n\
                     Connection: close\r\n\r\n{page}",
                    len = page.len()
                );
                let _ = stream.write_all(response.as_bytes());
                let _ = stream.flush();

                let result = match code {
                    Some(code) => OAuthResult::success(code),
                    None => OAuthResult::failure(if message.is_empty() {
                        "Giriş iptal edildi.".to_string()
                    } else {
                        message
                    }),
                };
                let _ = sender.send(result);
            }
        }
    });

    Ok((redirect_uri, receiver))
}

/// Sağlayıcının yetkilendirme adresi.
pub fn authorize_url(provider: &str, redirect_uri: &str) -> String {
    format!(
        "{}/api/auth/oauth/{provider}/start?redirect_uri={}",
        crate::api::API_BASE,
        urlencode(redirect_uri)
    )
}

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
