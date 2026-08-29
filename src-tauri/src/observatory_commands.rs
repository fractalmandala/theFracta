use serde_json::Value;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

fn root(variable: &str, fallback: PathBuf) -> PathBuf {
    env::var_os(variable).map(PathBuf::from).unwrap_or(fallback)
}
fn scans_root() -> PathBuf {
    dirs::home_dir()
        .map(|home| home.join(".repograph/scans"))
        .unwrap_or_else(|| PathBuf::from(".repograph/scans"))
}
fn logs_root() -> PathBuf {
    dirs::home_dir()
        .map(|home| home.join(".repograph/daily-logs"))
        .unwrap_or_else(|| PathBuf::from(".repograph/daily-logs"))
}
fn safe_child(root: &Path, child: &str) -> Result<PathBuf, String> {
    if child.is_empty() || child.contains('\0') {
        return Err("invalid path".into());
    }
    let base = root
        .canonicalize()
        .map_err(|_| "configured data root is unavailable")?;
    let candidate = base
        .join(child)
        .canonicalize()
        .map_err(|_| "requested data file is unavailable")?;
    if !candidate.starts_with(&base) {
        return Err("path escapes configured data root".into());
    }
    Ok(candidate)
}
fn json(path: &Path) -> Result<Value, String> {
    serde_json::from_slice(&fs::read(path).map_err(|_| "data file is unavailable")?)
        .map_err(|_| "data file contains invalid JSON".into())
}
fn valid_slug(value: &str) -> bool {
    !value.is_empty()
        && value
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
}
fn valid_date(value: &str) -> bool {
    value.len() == 10
        && value.chars().enumerate().all(|(i, c)| {
            if i == 4 || i == 7 {
                c == '-'
            } else {
                c.is_ascii_digit()
            }
        })
}

#[tauri::command]
pub fn get_projects() -> Result<Value, String> {
    let data = json(&safe_child(
        &root("FRACTA_REPOGRAPH_ROOT", scans_root()),
        "registry.json",
    )?)?;
    if !data.get("projects").and_then(Value::as_array).is_some() {
        return Err("invalid project registry".into());
    }
    Ok(data)
}
#[tauri::command]
pub fn get_scan(project: String, scan_type: String) -> Result<Value, String> {
    if !valid_slug(&project)
        || !matches!(
            scan_type.as_str(),
            "layout" | "system" | "boundary" | "health"
        )
    {
        return Err("invalid project or scan type".into());
    }
    let data = get_projects()?;
    let entry = data["projects"]
        .as_array()
        .and_then(|items| items.iter().find(|item| item["slug"] == project))
        .ok_or("project is not present in registry")?;
    if let Some(scans) = entry["scansAvailable"].as_array() {
        if !scans.iter().any(|item| item.as_str() == Some(&scan_type)) {
            return Err("scan type is unavailable".into());
        }
    }
    let payload = json(&safe_child(
        &root("FRACTA_REPOGRAPH_ROOT", scans_root()),
        &format!("{project}/{scan_type}.json"),
    )?)?;
    if payload["scan"] != scan_type {
        return Err("invalid scan payload".into());
    }
    Ok(payload)
}
#[tauri::command]
pub fn get_daily_logs_index() -> Result<Value, String> {
    let data = json(&safe_child(
        &root("FRACTA_DAILY_LOG_ROOT", logs_root()),
        "index.json",
    )?)?;
    let days = data["days"].as_array().ok_or("invalid daily-log index")?;
    if days.iter().any(|day| {
        !valid_date(day["date"].as_str().unwrap_or(""))
            || !day["file"].as_str().is_some_and(|file| {
                !file.contains('/') && !file.contains('\\') && file.ends_with(".json")
            })
    }) {
        return Err("invalid daily-log index entry".into());
    }
    Ok(data)
}
#[tauri::command]
pub fn get_daily_log(date: String) -> Result<Value, String> {
    if !valid_date(&date) {
        return Err("invalid date".into());
    }
    let index = get_daily_logs_index()?;
    let file = index["days"]
        .as_array()
        .and_then(|days| days.iter().find(|day| day["date"] == date))
        .and_then(|day| day["file"].as_str())
        .ok_or("daily log is unavailable")?;
    let data = json(&safe_child(
        &root("FRACTA_DAILY_LOG_ROOT", logs_root()),
        file,
    )?)?;
    if data["date"] != date {
        return Err("daily log date does not match index".into());
    }
    Ok(data)
}
#[tauri::command]
pub fn open_in_editor(
    file: String,
    line: Option<u32>,
    project_path: Option<String>,
) -> Result<String, String> {
    let path = Path::new(&file);
    let full = if path.is_absolute() {
        path.to_path_buf()
    } else if let Some(root) = project_path {
        Path::new(&root).join(path)
    } else {
        path.to_path_buf()
    };
    let target = line
        .map(|number| format!("{}:{number}", full.display()))
        .unwrap_or_else(|| full.display().to_string());
    let _ = Command::new("cursor")
        .arg("-g")
        .arg(&target)
        .spawn()
        .or_else(|_| Command::new("code").arg("-g").arg(&target).spawn())
        .or_else(|_| Command::new("open").arg(&full).spawn());
    Ok(target)
}

#[cfg(test)]
mod tests {
    use super::{valid_date, valid_slug};
    #[test]
    fn validates_boundaries() {
        assert!(valid_slug("my-project-2"));
        assert!(!valid_slug("../outside"));
        assert!(valid_date("2026-08-29"));
        assert!(!valid_date("2026/08/29"));
    }
}
