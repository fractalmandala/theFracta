//! The fonts installed on this machine.
//!
//! The web platform has an API for this — `queryLocalFonts()` — but it is
//! Chromium-only and WebKit does not implement it, so the app's own WKWebView
//! cannot ask. The list has to come from the native side, and on macOS
//! CoreText already keeps it: `CTFontManagerCopyAvailableFontFamilyNames`
//! returns family names, which is exactly the granularity a CSS `font-family`
//! wants — "Helvetica Neue", not "HelveticaNeue-BoldItalic".

/// Family names of every font installed, sorted, without the dot-prefixed
/// system faces that are not meant to be chosen by name.
#[tauri::command]
pub fn list_system_fonts() -> Vec<String> {
    families()
}

#[cfg(target_os = "macos")]
fn families() -> Vec<String> {
    use objc2_core_foundation::CFString;
    use objc2_core_text::CTFontManagerCopyAvailableFontFamilyNames;

    // SAFETY: the call takes no arguments and returns a +1 CFArray, which
    // objc2 releases when the CFRetained wrapper drops.
    let names = unsafe { CTFontManagerCopyAvailableFontFamilyNames() };

    // The array is untyped at the binding level; CoreText documents its
    // elements as CFStrings.
    let count = names.count();
    let mut out: Vec<String> = Vec::with_capacity(count as usize);
    for index in 0..count {
        // SAFETY: index is bounded by count, taken from the same array.
        let value = unsafe { names.value_at_index(index) };
        if value.is_null() {
            continue;
        }
        // SAFETY: element type is CFStringRef per CTFontManager's contract.
        let name = unsafe { &*(value as *const CFString) }.to_string();
        // Apple ships internal faces named ".SF NS", ".Helvetica Neue
        // DeskInterface" and so on. They are real fonts but are not addressable
        // by name from CSS, so offering them would be offering dead choices.
        if !name.starts_with('.') {
            out.push(name);
        }
    }

    out.sort_by_key(|name| name.to_lowercase());
    out.dedup();
    out
}

/// Other platforms get an empty list, and the UI falls back to naming the
/// generic families rather than pretending to have enumerated anything.
#[cfg(not(target_os = "macos"))]
fn families() -> Vec<String> {
    Vec::new()
}

#[cfg(test)]
mod tests {
    use super::families;

    #[cfg(target_os = "macos")]
    #[test]
    fn finds_real_families_and_hides_the_private_ones() {
        let found = families();
        assert!(
            found.len() > 20,
            "a macOS install has far more than 20 font families; got {}",
            found.len()
        );
        assert!(
            found.iter().any(|f| f == "Helvetica"),
            "Helvetica ships with every macOS"
        );
        assert!(
            !found.iter().any(|f| f.starts_with('.')),
            "private system faces are not offered: they cannot be selected by name from CSS"
        );
        // Sorted case-insensitively, so the select reads as a list rather than
        // as two lists spliced together.
        let mut sorted = found.clone();
        sorted.sort_by_key(|f| f.to_lowercase());
        assert_eq!(found, sorted);
    }
}
