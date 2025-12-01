import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { Button } from '~/components/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '~/components/dialog';
import { Input } from '~/components/input';
import './tailwind.css';

function App() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-4xl font-bold">Base UI Components</h1>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Button</h2>
        <div className="flex gap-4">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Input</h2>
        <Input placeholder="Enter text..." className="max-w-sm" />
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Dialog</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
              <DialogDescription>This is a dialog description.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p>Dialog content goes here.</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

