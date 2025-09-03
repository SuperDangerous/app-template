#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};
use tokio::time::{sleep, Duration};

// Backend process state
#[derive(Debug)]
struct BackendProcess(Mutex<Option<Child>>);

#[tauri::command]
async fn start_backend(app: AppHandle, state: State<'_, BackendProcess>) -> Result<(), String> {
    let mut process_guard = state.0.lock().unwrap();
    
    if process_guard.is_some() {
        return Ok(()); // Already running
    }

    if cfg!(debug_assertions) {
        // Development mode - run from source
        println!("Development mode: Backend should be started separately with 'npm run dev'");
        return Ok(());
    }

    // Production mode - use bundled sidecar binary
    let resource_dir = app.path().resource_dir()
        .map_err(|e| format!("Failed to resolve resource directory: {}", e))?;

    // Determine the binary name based on target triple
    let binary_name = if cfg!(target_os = "macos") {
        if cfg!(target_arch = "aarch64") {
            "server-aarch64-apple-darwin"
        } else {
            "server-x86_64-apple-darwin"
        }
    } else if cfg!(target_os = "windows") {
        "server-x86_64-pc-windows-msvc.exe"
    } else {
        "server-x86_64-unknown-linux-gnu"
    };

    let server_path = resource_dir.join("binaries").join(binary_name);
    
    println!("Starting server from: {:?}", server_path);

    // Start the bundled server binary
    let child = Command::new(&server_path)
        .env("TAURI", "1")  // Set desktop mode
        .env("NODE_ENV", "production")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start server binary {}: {}", server_path.display(), e))?;

    *process_guard = Some(child);
    println!("Server started successfully");
    Ok(())
}

#[tauri::command]
fn stop_backend(state: State<BackendProcess>) -> Result<(), String> {
    let mut process_guard = state.0.lock().unwrap();
    
    if let Some(mut child) = process_guard.take() {
        match child.kill() {
            Ok(_) => {
                let _ = child.wait();
                println!("Backend stopped successfully");
                Ok(())
            }
            Err(e) => Err(format!("Failed to stop backend: {}", e))
        }
    } else {
        Ok(()) // Already stopped
    }
}

#[tauri::command]
fn get_backend_status(state: State<BackendProcess>) -> String {
    let process_guard = state.0.lock().unwrap();
    match process_guard.as_ref() {
        Some(child) => {
            // Check if process is still alive
            match child.try_wait() {
                Ok(Some(_)) => "stopped".to_string(), // Process has exited
                Ok(None) => "running".to_string(),     // Process is still running
                Err(_) => "unknown".to_string(),       // Error checking status
            }
        }
        None => "stopped".to_string(),
    }
}

#[tauri::command]
fn get_api_url() -> String {
    // Return the expected API URL for the StandardServer
    "http://localhost:8080".to_string()
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(BackendProcess(Mutex::new(None)))
        .setup(|app| {
            // Start backend automatically
            let app_handle = app.handle().clone();
            
            tauri::async_runtime::spawn(async move {
                // Wait a moment for the app to initialize
                sleep(Duration::from_millis(1000)).await;
                
                // Get the state from the app handle
                let backend_state = app_handle.state::<BackendProcess>();
                if let Err(e) = start_backend(app_handle.clone(), backend_state).await {
                    eprintln!("Failed to auto-start backend: {}", e);
                }
            });
            
            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                }
                
                println!("🔧 Development mode - Backend should be started separately");
                println!("   Run: npm run dev");
            }
            
            #[cfg(not(debug_assertions))]
            {
                println!("🚀 Production mode - Starting bundled backend server");
            }
            
            // Log app directories for debugging
            if let Ok(app_dir) = app.path().app_data_dir() {
                println!("📁 App data directory: {:?}", app_dir);
            }
            
            println!("✨ EpiSensor App Template initialized");
            println!("🌐 Backend API: http://localhost:8080");
            
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