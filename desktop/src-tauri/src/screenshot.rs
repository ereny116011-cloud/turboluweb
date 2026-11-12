//! Geliştirme amaçlı ekran görüntüsü.
//!
//! Tauri 2'de hazır bir `capture` çağrısı yok; bu modül pencereyi Windows
//! GDI aracılığıyla yakalar ve PNG olarak diske yazar. Yalnızca `TURBOLU_SHOT`
//! ortam değişkeni tanımlıyken (geliştirme modunda) kullanılır.

use std::path::Path;

/// Pencereyi yakalar ve PNG olarak diske yazar.
pub fn kaydet<R: tauri::Runtime>(
    window: &tauri::WebviewWindow<R>,
    yol: &Path,
) -> Result<(), String> {
    if let Some(parent) = yol.parent() {
        let _ = std::fs::create_dir_all(parent);
    }

    #[cfg(target_os = "windows")]
    {
        windows::kaydet(window, yol)?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = window;
        return Err("Bu platformda ekran görüntüsü henüz desteklenmiyor.".to_string());
    }

    Ok(())
}

#[cfg(target_os = "windows")]
mod windows {
    use super::Path;
    use tauri::WebviewWindow;

    /// Pencereyi GDI ile yakalar ve PNG olarak yazar.
    pub fn kaydet<R: tauri::Runtime>(
        window: &WebviewWindow<R>,
        yol: &Path,
    ) -> Result<(), String> {
        use windows_sys::Win32::Foundation::{HWND, RECT};
        use windows_sys::Win32::Graphics::Gdi::{
            CreateCompatibleDC, CreateDIBSection, DeleteDC, DeleteObject, GetDIBits, GetDC,
            ReleaseDC, SelectObject, BITMAPINFO, BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS,
        };
        use windows_sys::Win32::Storage::Xps::PrintWindow;
        use windows_sys::Win32::UI::WindowsAndMessaging::{
            GetClientRect, GetWindowRect, PW_RENDERFULLCONTENT,
        };

        unsafe {
            let hwnd = match window.hwnd() {
                Ok(value) => value.0 as HWND,
                Err(_) => return Err("Pencere tutamağı alınamadı.".to_string()),
            };

            let mut rect: RECT = std::mem::zeroed();
            if GetWindowRect(hwnd, &mut rect) == 0 {
                return Err("Pencere ölçüsü alınamadı.".to_string());
            }
            let mut client: RECT = std::mem::zeroed();
            GetClientRect(hwnd, &mut client);

            let genişlik = (client.right - client.left).max(1);
            let yükseklik = (client.bottom - client.top).max(1);

            let ekran_dc = GetDC(hwnd);
            if ekran_dc.is_null() {
                return Err("Görüntü bağlamı alınamadı.".to_string());
            }
            let bellek_dc = CreateCompatibleDC(ekran_dc);
            if bellek_dc.is_null() {
                ReleaseDC(hwnd, ekran_dc);
                return Err("Bellek bağlamı oluşturulamadı.".to_string());
            }

            let mut bilgi: BITMAPINFO = std::mem::zeroed();
            bilgi.bmiHeader.biSize = std::mem::size_of::<BITMAPINFOHEADER>() as u32;
            bilgi.bmiHeader.biWidth = genişlik;
            bilgi.bmiHeader.biHeight = -yükseklik; // Baş aşağı (üstten alta)
            bilgi.bmiHeader.biPlanes = 1;
            bilgi.bmiHeader.biBitCount = 32;
            bilgi.bmiHeader.biCompression = BI_RGB;

            let mut pikseller: *mut core::ffi::c_void = std::ptr::null_mut();
            let bitmap = CreateDIBSection(
                bellek_dc,
                &mut bilgi,
                DIB_RGB_COLORS,
                &mut pikseller,
                std::ptr::null_mut(),
                0,
            );
            if bitmap.is_null() || pikseller.is_null() {
                DeleteDC(bellek_dc);
                ReleaseDC(hwnd, ekran_dc);
                return Err("Bitmap oluşturulamadı.".to_string());
            }

            let eski = SelectObject(bellek_dc, bitmap);
            PrintWindow(hwnd, bellek_dc, PW_RENDERFULLCONTENT);

            let mut arabellek = vec![0u8; (genişlik * yükseklik * 4) as usize];
            GetDIBits(
                bellek_dc,
                bitmap,
                0,
                yükseklik as u32,
                arabellek.as_mut_ptr() as *mut core::ffi::c_void,
                &mut bilgi,
                DIB_RGB_COLORS,
            );

            SelectObject(bellek_dc, eski);
            DeleteObject(bitmap);
            DeleteDC(bellek_dc);
            ReleaseDC(hwnd, ekran_dc);

            // GDI piksel düzeni BGRA; PNG için RGBA'ya çevrilir.
            let mut rgba = Vec::with_capacity(arabellek.len());
            for piksel in arabellek.chunks_exact(4) {
                rgba.extend_from_slice(&[piksel[2], piksel[1], piksel[0], piksel[3]]);
            }

            let resim = image::RgbaImage::from_raw(genişlik as u32, yükseklik as u32, rgba)
                .ok_or_else(|| "Görüntü oluşturulamadı.".to_string())?;

            resim
                .save(yol)
                .map_err(|_| "PNG yazılamadı.".to_string())
        }
    }
}
