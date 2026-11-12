//! TurboluApp PC — Rust/Tauri uygulaması.
//!
//! Arayüz (HTML/CSS/JS) renderer tarafında durur; ağ istekleri, oturum
//! saklama, sosyal giriş ve pencere işlemleri bu Rust tarafında yapılır.

// Konsol penceresi açılmasın (yalnızca Windows, yayın derlemesinde).
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod api;
mod oauth;
mod screenshot;
mod session;

use std::sync::Mutex;

use serde::Serialize;
use tauri::{Emitter, Manager, State};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_opener::OpenerExt;

use session::Session;

/// Uygulama genelinde paylaşılan durum.
struct AppState {
    session: Mutex<Session>,
    client: reqwest::Client,
    /// Aktif sosyal giriş işlemi (sağlayıcı adı).
    oauth_busy: Mutex<bool>,
}

/// Renderer'a dönen uygulama bilgisi.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AppInfo {
    version: String,
    platform: String,
    arch: String,
    runtime: String,
    webview: String,
    website: String,
    github: String,
    api: String,
}

/// Pencere durumu değişimi.
#[derive(Clone, Serialize)]
struct WindowState {
    maximized: bool,
}

/// Sosyal giriş sonucu.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct OAuthOutcome {
    ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    code: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

/// API çağrısı.
#[tauri::command]
async fn api_call(
    state: State<'_, AppState>,
    payload: api::ApiPayload,
) -> Result<api::ApiResponse, String> {
    let token = {
        let session = state.session.lock().map_err(|_| "Oturum kilitlenemedi.".to_string())?;
        session.token().to_string()
    };
    Ok(api::call_api(&state.client, &token, payload).await)
}

/// Sunucu durumu.
#[tauri::command]
async fn server_status(state: State<'_, AppState>, kind: String) -> Result<serde_json::Value, String> {
    let source = match kind.as_str() {
        "java" => "https://api.mcsrvstat.us/2/turbolumc.aternos.me",
        "bedrock" => "https://api.mcsrvstat.us/bedrock/2/turbolubedrock.mcsh.io",
        _ => return Err("Bilinmeyen sunucu.".to_string()),
    };

    let response = state
        .client
        .get(source)
        .timeout(std::time::Duration::from_secs(9))
        .send()
        .await
        .map_err(|_| "Durum bilgisi alınamadı.".to_string())?;

    if !response.status().is_success() {
        return Err("Durum bilgisi alınamadı.".to_string());
    }

    let data: serde_json::Value = response
        .json()
        .await
        .map_err(|_| "Durum bilgisi alınamadı.".to_string())?;

    if !data.get("online").and_then(|value| value.as_bool()).is_some() {
        return Err("Durum bilgisi alınamadı.".to_string());
    }

    let players = data.get("players").cloned().unwrap_or(serde_json::Value::Null);
    Ok(serde_json::json!({
        "ok": true,
        "online": data.get("online").and_then(|value| value.as_bool()).unwrap_or(false),
        "players": {
            "online": players.get("online").and_then(|value| value.as_u64()).unwrap_or(0),
            "max": players.get("max").and_then(|value| value.as_u64()).unwrap_or(0)
        },
        "version": data.get("version").and_then(|value| value.as_str()).unwrap_or(""),
        "hostname": data.get("hostname").and_then(|value| value.as_str()).unwrap_or(""),
        "ip": data.get("ip").and_then(|value| value.as_str()).unwrap_or(""),
        "cached": data
            .get("debug")
            .and_then(|debug| debug.get("cachehit"))
            .and_then(|value| value.as_bool())
            .unwrap_or(false)
    }))
}

/// Oturumu okur.
#[tauri::command]
fn auth_load(state: State<'_, AppState>) -> Result<String, String> {
    let session = state.session.lock().map_err(|_| "Oturum kilitlenemedi.".to_string())?;
    Ok(session.token().to_string())
}

/// Test amaçlı ekran görüntüsü alır ve pencereyi kapatır.
/// `TURBOLU_SHOT` ortam değişkeni tanımlıysa dev modunda çalışır.
#[tauri::command]
async fn dev_screenshot(app: tauri::AppHandle, path: String) -> Result<bool, String> {
    if std::env::var("TURBOLU_SHOT").is_err() {
        return Err("Ekran görüntüsü yalnızca geliştirme modunda alınır.".to_string());
    }

    // Kısa bir bekleme: renderer'ın son çizimi tamamlaması için.
    tokio::time::sleep(std::time::Duration::from_millis(400)).await;

    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Pencere bulunamadı.".to_string())?;

    screenshot::kaydet(&window, std::path::Path::new(&path))?;

    let _ = window.close();
    let _ = app.exit(0);
    Ok(true)
}

/// Test betiğini renderer'da çalıştırır.
///
/// CSP `script-src 'self'` olduğu için renderer içinde `new Function` çalışmaz;
/// betik doğrudan Rust tarafından yürütülür.
#[tauri::command]
async fn devshot_eval(app: tauri::AppHandle, betik: String) -> Result<bool, String> {
    if std::env::var("TURBOLU_SHOT").is_err() {
        return Err("Test betiği yalnızca geliştirme modunda çalışır.".to_string());
    }
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Pencere bulunamadı.".to_string())?;
    window.eval(&betik).map_err(|_| "Betik çalıştırılamadı.".to_string())?;
    Ok(true)
}

/// Test ayarlarını renderer'a verir.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DevShotConfig {
    yol: String,
    sayfa: String,
    tema: String,
    betik: String,
}

#[tauri::command]
fn devshot_config() -> Result<DevShotConfig, String> {
    let yol = std::env::var("TURBOLU_SHOT").unwrap_or_default();
    if yol.is_empty() {
        return Err("Test modu kapalı.".to_string());
    }
    Ok(DevShotConfig {
        yol,
        sayfa: std::env::var("TURBOLU_SHOT_PAGE").unwrap_or_default(),
        tema: std::env::var("TURBOLU_SHOT_THEME").unwrap_or_default(),
        betik: std::env::var("TURBOLU_SHOT_EVAL").unwrap_or_default(),
    })
}

/// Oturumu kaydeder.
#[tauri::command]
fn auth_save(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    token: String,
) -> Result<bool, String> {
    let value = token.trim().to_string();
    if value.is_empty() || value.len() > 200 || !value.chars().all(|c| c.is_ascii_alphanumeric() || c == '.' || c == '_' || c == '-')
    {
        return Ok(false);
    }

    let mut session = state.session.lock().map_err(|_| "Oturum kilitlenemedi.".to_string())?;
    session.set(&value);
    if let Some(dir) = app.path().app_data_dir().ok() {
        session.persist(&dir);
    }
    Ok(true)
}

/// Oturumu siler.
#[tauri::command]
fn auth_clear(app: tauri::AppHandle, state: State<'_, AppState>) -> Result<bool, String> {
    let mut session = state.session.lock().map_err(|_| "Oturum kilitlenemedi.".to_string())?;
    session.clear();
    if let Some(dir) = app.path().app_data_dir().ok() {
        session.persist(&dir);
    }
    Ok(true)
}

/// Panoya metin yazar.
#[tauri::command]
fn clipboard_write(app: tauri::AppHandle, text: String) -> Result<bool, String> {
    let value: String = text.chars().take(4096).collect();
    app.clipboard()
        .write_text(value)
        .map_err(|_| "Panoya yazılamadı.".to_string())?;
    Ok(true)
}

/// Dış bağlantıyı tarayıcıda açar.
#[tauri::command]
fn shell_open(app: tauri::AppHandle, url: String) -> Result<bool, String> {
    open_external(&app, &url);
    Ok(true)
}

/// Yalnızca izin listesindeki adresler dışarı açılabilir.
fn open_external(app: &tauri::AppHandle, raw_url: &str) -> bool {
    const WEBSITE: &str = "https://turboluweb.wasmer.app";
    const GITHUB: &str = "https://github.com/ereny116011-cloud/turboluweb";
    const WORKER: &str = "https://shrill-salad-a498.ereny116011.workers.dev";

    let parsed = match url::Url::parse(raw_url) {
        Ok(parsed) => parsed,
        Err(_) => return false,
    };
    if parsed.scheme() != "https" && parsed.scheme() != "http" {
        return false;
    }
    // Kimlik bilgisi içeren adresler (https://site@kotu-host) kabul edilmez.
    if !parsed.username().is_empty() || parsed.password().is_some() {
        return false;
    }

    let origin = parsed.origin().ascii_serialization();
    let allowed = [WEBSITE, GITHUB, WORKER];
    if !allowed.iter().any(|base| origin == *base) {
        return false;
    }

    let _ = app.opener().open_url(parsed.as_str(), None::<&str>);
    true
}

/// Temayı ayarlar; çözümlenen temayı döner.
#[tauri::command]
fn theme_set(app: tauri::AppHandle, mode: String) -> Result<String, String> {
    use tauri::Theme;

    let theme = match mode.as_str() {
        "dark" => Theme::Dark,
        "light" => Theme::Light,
        _ => Theme::Dark,
    };

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_theme(Some(theme));
        if let Ok(current) = window.theme() {
            return Ok(match current {
                tauri::Theme::Light => "light".to_string(),
                _ => "dark".to_string(),
            });
        }
    }
    Ok("dark".to_string())
}

/// Uygulama bilgisi.
#[tauri::command]
fn app_info(app: tauri::AppHandle) -> AppInfo {
    AppInfo {
        version: app.package_info().version.to_string(),
        platform: platform_name(),
        arch: std::env::consts::ARCH.to_string(),
        runtime: format!("Tauri {}", tauri::VERSION),
        webview: webview_name(),
        website: "https://turboluweb.wasmer.app".to_string(),
        github: "https://github.com/ereny116011-cloud/turboluweb".to_string(),
        api: api::API_BASE.to_string(),
    }
}

fn webview_name() -> String {
    #[cfg(target_os = "windows")]
    {
        "WebView2".to_string()
    }
    #[cfg(target_os = "macos")]
    {
        "WKWebView".to_string()
    }
    #[cfg(all(unix, not(target_os = "macos")))]
    {
        "WebKitGTK".to_string()
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos", unix)))]
    {
        "WebView".to_string()
    }
}

/// İşletim sistemi adı (CSS'teki `data-platform` değerleriyle eşleşir).
fn platform_name() -> String {
    match std::env::consts::OS {
        "windows" => "win32",
        "macos" => "darwin",
        other => other,
    }
    .to_string()
}

/// Pencereyi küçültür.
#[tauri::command]
fn win_minimize(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.minimize();
    }
}

/// Pencereyi büyütür / küçültür; yeni durumu döner.
#[tauri::command]
fn win_toggle_maximize(app: tauri::AppHandle) -> Result<bool, String> {
    if let Some(window) = app.get_webview_window("main") {
        let maximized = window.is_maximized().unwrap_or(false);
        if maximized {
            let _ = window.unmaximize();
            return Ok(false);
        }
        let _ = window.maximize();
        return Ok(true);
    }
    Ok(false)
}

/// Pencereyi kapatır.
#[tauri::command]
fn win_close(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.close();
    }
}

/// Pencere büyütülmüş mü?
#[tauri::command]
fn win_is_maximized(app: tauri::AppHandle) -> bool {
    app.get_webview_window("main")
        .and_then(|window| window.is_maximized().ok())
        .unwrap_or(false)
}

/// Sosyal giriş başlatır.
#[tauri::command]
async fn oauth_login(app: tauri::AppHandle, state: State<'_, AppState>, provider: String) -> Result<OAuthOutcome, String> {
    {
        let mut busy = state.oauth_busy.lock().map_err(|_| "Giriş başlatılamadı.".to_string())?;
        if *busy {
            return Ok(OAuthOutcome {
                ok: false,
                code: None,
                error: Some("Zaten açık bir giriş işlemi var. Tarayıcıdaki sekmeyi tamamla.".to_string()),
            });
        }
        *busy = true;
    }

    let outcome = run_oauth(&app, &provider).await;

    if let Ok(mut busy) = state.oauth_busy.lock() {
        *busy = false;
    }

    Ok(outcome)
}

/// Köprüyü kurar, tarayıcıyı açar ve sonucu bekler.
async fn run_oauth(app: &tauri::AppHandle, provider: &str) -> OAuthOutcome {
    let (redirect_uri, receiver) = match oauth::start_bridge(provider) {
        Ok(parts) => parts,
        Err(message) => {
            return OAuthOutcome { ok: false, code: None, error: Some(message) };
        }
    };

    let target = oauth::authorize_url(provider, &redirect_uri);
    if !open_external(app, &target) {
        return OAuthOutcome {
            ok: false,
            code: None,
            error: Some("Tarayıcı açılamadı.".to_string()),
        };
    }

    // Sonuç ya gelir ya da zaman aşımına uğrar.
    let result = tokio::task::spawn_blocking(move || receiver.recv_timeout(oauth::OAUTH_TIMEOUT))
        .await
        .unwrap_or(Err(std::sync::mpsc::RecvTimeoutError::Timeout));

    match result {
        Ok(outcome) => OAuthOutcome {
            ok: outcome.ok,
            code: outcome.code,
            error: outcome.error,
        },
        Err(_) => OAuthOutcome {
            ok: false,
            code: None,
            error: Some("Giriş zaman aşımına uğradı. Lütfen yeniden dene.".to_string()),
        },
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            // İkinci örnek başlatıldığında mevcut pencere öne getirilir.
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .setup(|app| {
            let handle = app.handle().clone();

            // Pencere durumu değişimini renderer'a bildir.
            if let Some(window) = app.get_webview_window("main") {
                let emitter = handle.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::Resized(_) = event {
                        let maximized = emitter
                            .get_webview_window("main")
                            .and_then(|window| window.is_maximized().ok())
                            .unwrap_or(false);
                        let _ = emitter.emit("win:state", WindowState { maximized });
                    }
                });
            }

            let app_data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::env::temp_dir());
            let session = Session::load(&app_data_dir);

            app.manage(AppState {
                session: Mutex::new(session),
                client: api::http_client(),
                oauth_busy: Mutex::new(false),
            });

            // Pencere hazır olduğunda görünür olur (beyaz flaşı önler).
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            api_call,
            server_status,
            auth_load,
            auth_save,
            auth_clear,
            clipboard_write,
            shell_open,
            theme_set,
            app_info,
            win_minimize,
            win_toggle_maximize,
            win_close,
            win_is_maximized,
            oauth_login,
            dev_screenshot,
            devshot_eval,
            devshot_config,
        ])
        .run(tauri::generate_context!())
        .expect("TurboluApp başlatılamadı");
}
