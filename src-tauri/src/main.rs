#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager, State};
use tokio::time::{sleep, Duration};

// Backend process state
#[derive(Debug)]
struct BackendProcess(Mutex<Option<Child>>);

#[tauri::command]
async fn start_backend(app: AppHandle, state: State<'_, BackendProcess>) -> Result<(), String> {
    let mut process_guard = state.0.lock().unwrap();
    
    if process_guard.is_some() {
        return Err("Backend is already running".to_string());
    }

    let exe_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    std::fs::create_dir_all(&exe_dir)
        .map_err(|e| format!("Failed to create app data dir: {}", e))?;

    // Try to find the backend executable
    let backend_path = if cfg!(debug_assertions) {
        // Development mode - run from source
        let mut cmd = Command::new("npm");
        cmd.args(&["run", "dev:api"])
           .current_dir(exe_dir.parent().unwrap().parent().unwrap())
           .stdout(Stdio::piped())
           .stderr(Stdio::piped());
        
        let child = cmd.spawn()
            .map_err(|e| format!("Failed to start backend: {}", e))?;
        
        *process_guard = Some(child);
        Ok(())
    } else {
        // Production mode - backend should be bundled or available
        Err("Production backend startup not implemented yet".to_string())
    };

    backend_path
}

#[tauri::command]
fn stop_backend(state: State<BackendProcess>) -> Result<(), String> {
    let mut process_guard = state.0.lock().unwrap();
    
    if let Some(mut child) = process_guard.take() {
        match child.kill() {
            Ok(_) => {
                let _ = child.wait();
                Ok(())
            }
            Err(e) => Err(format!("Failed to stop backend: {}", e))
        }
    } else {
        Err("Backend is not running".to_string())
    }
}

#[tauri::command]
fn get_backend_status(state: State<BackendProcess>) -> String {
    let process_guard = state.0.lock().unwrap();
    match process_guard.as_ref() {
        Some(_) => "running".to_string(),
        None => "stopped".to_string(),
    }
}

#[tauri::command]
fn get_api_url(app: AppHandle) -> Result<String, String> {
    // Try to read the app.json config file
    let app_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    let config_path = app_dir.parent().unwrap().parent().unwrap().join("app.json");
    
    if config_path.exists() {
        let config_content = std::fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read config: {}", e))?;
        
        let config: serde_json::Value = serde_json::from_str(&config_content)
            .map_err(|e| format!("Failed to parse config: {}", e))?;
        
        if let Some(api_port) = config["ports"]["api"].as_u64() {
            return Ok(format!("http://localhost:{}", api_port));
        }
    }
    
    // Fallback to default port
    Ok("http://localhost:8080".to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(BackendProcess(Mutex::new(None)))
        .setup(|app| {
            // Start backend automatically in production
            #[cfg(not(debug_assertions))]
            {
                let app_handle = app.handle().clone();
                
                tauri::async_runtime::spawn(async move {
                    // Wait a moment for the app to initialize
                    sleep(Duration::from_millis(500)).await;
                    
                    // Get the state from the app handle
                    let backend_state = app_handle.state::<BackendProcess>();
                    if let Err(e) = start_backend(app_handle.clone(), backend_state).await {
                        eprintln!("Failed to auto-start backend: {}", e);
                    }
                });
            }
            
            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                }
                
                println!("Desktop app started in development mode");
                println!("Backend will be started separately with 'npm run dev:api'");
            }
            
            // Log app directories for debugging
            if let Ok(app_dir) = app.path().app_data_dir() {
                println!("App data directory: {:?}", app_dir);
            }
            
            println!("EpiSensor App Template initialized");
            println!("The backend API will be accessible on port 8080");
            
            Ok(())
        })
        .on_window_event(|window, event| {
            // Clean up backend when window closes
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                let state = window.state::<BackendProcess>();
                let _ = stop_backend(state);
            }
        })
        .invoke_handler(tauri::generate_handler![
            start_backend,
            stop_backend,
            get_backend_status,
            get_api_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}