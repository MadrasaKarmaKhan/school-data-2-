import React, { useState } from 'react';
import { Upload, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CloudUploader() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Student');
  const [file, setFile] = useState<File | null>(null);
  
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !file) return;

    setStatus('uploading');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('role', role);
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload');
      }

      setStatus('success');
      setName('');
      setEmail('');
      setFile(null);
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setErrorMessage(error.message || 'Something went wrong.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-2xl font-serif text-slate-800 dark:text-slate-100 mb-2">Cloud Sync System</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Aapka data Google Sheets aur file Cloudinary me save hoga.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pura Naam (Full Name)</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 border-emerald-500"
            placeholder="Mohammad Ali"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 border-emerald-500"
            placeholder="ali@example.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 border-emerald-500"
          >
            <option value="Student">Student (Talib-e-Ilm)</option>
            <option value="Teacher">Teacher (Ustad)</option>
            <option value="Parent">Parent (Walidain)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">File (Document/Image)</label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-3 text-slate-400" />
                <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                {file && <p className="text-xs text-emerald-600 font-medium">{file.name}</p>}
              </div>
              <input 
                type="file" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                  }
                }} 
              />
            </label>
          </div>
        </div>

        {status === 'error' && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{errorMessage} - <span className="font-bold">Ensure Backend Env Vars (Cloudinary & Google Sheets) are valid.</span></p>
          </div>
        )}

        {status === 'success' && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <p>Alhamdulillah! Data Sheets aur Cloudinary mein upload ho gaya.</p>
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'uploading' || !file}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white font-medium transition-all ${
            status === 'uploading' || !file ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 active:transform active:scale-[0.98]'
          }`}
        >
          {status === 'uploading' ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><Send className="w-4 h-4" /> Upload aur Save Karein</>
          )}
        </button>
      </form>
    </div>
  );
}
