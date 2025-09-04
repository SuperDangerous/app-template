import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@episensor/app-framework/ui';
import { Activity, Cpu, HardDrive, Wifi } from 'lucide-react';

export function HomePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Welcome to Your App</h1>
        <p className="text-muted-foreground mt-2">
          Get started by customizing this template for your needs.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">
              System is running normally
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23%</div>
            <p className="text-xs text-muted-foreground">
              +2% from last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45%</div>
            <p className="text-xs text-muted-foreground">
              2.1GB of 4.6GB used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Connected</div>
            <p className="text-xs text-muted-foreground">
              Low latency
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>
              This template provides everything you need to build an EpiSensor internal app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Key Features</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>TypeScript + React + Vite for fast development</li>
                <li>Tauri for desktop packaging across platforms</li>
                <li>EpiSensor App Framework for consistent functionality</li>
                <li>WebSocket support for real-time updates</li>
                <li>Built-in logging and configuration</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Next Steps</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Update app.json with your app details</li>
                <li>Modify the navigation and pages for your use case</li>
                <li>Add your business logic and API endpoints</li>
                <li>Customize the UI components and styling</li>
                <li>Build and distribute your desktop app</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
