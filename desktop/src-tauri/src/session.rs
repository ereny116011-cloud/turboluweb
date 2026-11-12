//! Oturum token'ının güvenli saklanması.
//!
//! Electron'daki `safeStorage` karşılığı olarak işletim sistemi anahtar
//! deposu kullanılır (Windows: Credential Manager, macOS: Keychain,
//! Linux: Secret Service). Depo kullanılamıyorsa token dosyada düz metin
//! tutulur; dosya izinleri yalnızca kullanıcıya açık olacak şekilde ayarlanır.

use std::path::PathBuf;

const SERVICE_NAME: &str = "app.turbolu.desktop";
const ACCOUNT_NAME: &str = "session";

/// Oturum token'ı.
#[derive(Clone, Debug, Default)]
pub struct Session {
    token: String,
}

impl Session {
    pub fn token(&self) -> &str {
        &self.token
    }

    /// Yeni oturumu kurar; `token` boşsa oturum silinir.
    pub fn set(&mut self, token: &str) {
        self.token = token.to_string();
    }

    pub fn clear(&mut self) {
        self.token.clear();
    }

    /// Kayıtlı oturumu okur. Önce anahtar deposu, sonra yedek dosya.
    pub fn load(app_dir: &PathBuf) -> Self {
        let token = read_from_store()
            .or_else(|| read_from_file(app_dir))
            .unwrap_or_default();
        Self { token }
    }

    /// Oturumu kalıcı hale getirir.
    pub fn persist(&self, app_dir: &PathBuf) {
        if self.token.is_empty() {
            let _ = delete_from_store();
            let _ = std::fs::remove_file(session_file(app_dir));
            return;
        }

        if write_to_store(&self.token).is_err() {
            // Depo yoksa dosyaya yaz; dosya izinleri kullanıcıya sınırlanır.
            let _ = write_to_file(app_dir, &self.token);
        } else {
            // Depo kullanılıyorsa düz metin yedeği temizlenir.
            let _ = std::fs::remove_file(session_file(app_dir));
        }
    }
}

fn session_file(app_dir: &PathBuf) -> PathBuf {
    app_dir.join("session.txt")
}

fn read_from_store() -> Option<String> {
    let entry = keyring::Entry::new(SERVICE_NAME, ACCOUNT_NAME).ok()?;
    entry.get_password().ok().filter(|value| !value.is_empty())
}

fn write_to_store(token: &str) -> Result<(), keyring::Error> {
    let entry = keyring::Entry::new(SERVICE_NAME, ACCOUNT_NAME)?;
    entry.set_password(token)
}

fn delete_from_store() -> Result<(), keyring::Error> {
    let entry = keyring::Entry::new(SERVICE_NAME, ACCOUNT_NAME)?;
    entry.delete_credential()
}

fn read_from_file(app_dir: &PathBuf) -> Option<String> {
    let text = std::fs::read_to_string(session_file(app_dir)).ok()?;
    let value = text.trim().to_string();
    if value.is_empty() {
        None
    } else {
        Some(value)
    }
}

fn write_to_file(app_dir: &PathBuf, token: &str) -> std::io::Result<()> {
    if !app_dir.exists() {
        std::fs::create_dir_all(app_dir)?;
    }
    let target = session_file(app_dir);
    std::fs::write(&target, token)?;
    restrict_permissions(&target);
    Ok(())
}

/// Yalnızca sahibi okuyabilsin (Unix).
fn restrict_permissions(path: &PathBuf) {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o600));
    }
    #[cfg(not(unix))]
    {
        let _ = path;
    }
}
