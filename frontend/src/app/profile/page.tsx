'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../../components/AuthContext';
import { getDetailedProfile, updateDetailedProfile, getUserProfile, saveDocument, deleteDocument, parseResume, reviseDocument, extractProfile } from '../../lib/api';

interface Experience {
  company: string;
  title: string;
  location: string;
  description: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  
  // States for standard fields
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    linkedin: '',
    portfolio: '',
    resume_text: '',
    certifications: '',
    skills: '',
    coursework: ''
  });

  const [experiences, setExperiences] = useState<Experience[]>([{
    company: '', title: '', location: '', description: ''
  }]);

  // State for documents list
  const [documents, setDocuments] = useState<any[]>([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Upload Type Modal
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadDocType, setUploadDocType] = useState('resume');

  // Modal for pasting text document
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteName, setPasteName] = useState('');
  const [pasteType, setPasteType] = useState('resume');
  const [pasteContent, setPasteContent] = useState('');
  
  // AI Revision Modal State
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [revising, setRevising] = useState(false);
  const [revisedContent, setRevisedContent] = useState('');
  const [targetReviseDoc, setTargetReviseDoc] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileData, authInfo] = await Promise.all([
        getDetailedProfile(),
        getUserProfile()
      ]);
      
      setProfile({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        linkedin: profileData.linkedin || '',
        portfolio: profileData.portfolio || '',
        resume_text: profileData.resume_text || '',
        certifications: profileData.certifications || '',
        skills: profileData.skills || '',
        coursework: profileData.coursework || ''
      });

      // Parse experience JSON logic
      if (profileData.experience) {
        try {
          const parsedExp = JSON.parse(profileData.experience);
          if (Array.isArray(parsedExp)) {
            setExperiences(parsedExp);
          } else {
            // Legacy backup
            setExperiences([{ company: '', title: '', location: '', description: profileData.experience }]);
          }
        } catch (e) {
             setExperiences([{ company: '', title: '', location: '', description: profileData.experience }]);
        }
      }

      setDocuments(authInfo.documents || []);
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleExpChange = (index: number, field: keyof Experience, value: string) => {
    const nextExp = [...experiences];
    nextExp[index] = { ...nextExp[index], [field]: value };
    setExperiences(nextExp);
  };

  const addExperience = () => {
    setExperiences([...experiences, { company: '', title: '', location: '', description: '' }]);
  };

  const removeExperience = (index: number) => {
    if (experiences.length === 1) return;
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      // Stringify array
      const payload = {
        ...profile,
        experience: JSON.stringify(experiences)
      };
      await updateDetailedProfile(payload);
      setMessage('Profile saved successfully!');
    } catch (err) {
      setMessage('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // --- Document File Upload ---
  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setShowTypeModal(true);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmFileUpload = async () => {
    if (!pendingFile) return;
    setDocLoading(true);
    setShowTypeModal(false);
    try {
      const parsed = await parseResume(pendingFile);
      
      // Call AI extraction service to elegantly parse array schemas
      try {
         const profilePieces = await extractProfile(parsed.raw_text);
         
         setProfile(prev => ({
           ...prev,
           skills: profilePieces.skills || prev.skills,
           certifications: profilePieces.certifications || prev.certifications,
           coursework: profilePieces.coursework || prev.coursework,
           first_name: prev.first_name || profilePieces.first_name || '',
           last_name: prev.last_name || profilePieces.last_name || '',
           email: prev.email || profilePieces.email || '',
           phone: prev.phone || profilePieces.phone || '',
           linkedin: prev.linkedin || profilePieces.linkedin || '',
           portfolio: prev.portfolio || profilePieces.portfolio || '',
         }));
         
         if (profilePieces.experiences && profilePieces.experiences.length > 0) {
           setExperiences(profilePieces.experiences);
         }
      } catch (aiErr) {
         console.warn("AI extraction failed, falling back to basic parsed sections.");
         setProfile(prev => ({
           ...prev,
           skills: parsed.sections.skills || prev.skills,
           certifications: parsed.sections.certifications || prev.certifications,
           coursework: parsed.sections.education || prev.coursework,
         }));
         if (parsed.sections.experience) {
           setExperiences([{ company: '', title: '', location: '', description: parsed.sections.experience }]);
         }
      }

      await saveDocument(uploadDocType, pendingFile.name, parsed.raw_text);
      const authInfo = await getUserProfile();
      setDocuments(authInfo.documents || []);
    } catch (err) {
      alert("Failed to upload and parse file.");
    } finally {
      setDocLoading(false);
      setPendingFile(null);
    }
  };

  const handlePasteSave = async () => {
    if (!pasteName || !pasteContent) {
      alert("Name and content are required.");
      return;
    }
    setDocLoading(true);
    try {
      await saveDocument(pasteType, pasteName, pasteContent);
      setShowPasteModal(false);
      setPasteName('');
      setPasteContent('');
      const authInfo = await getUserProfile();
      setDocuments(authInfo.documents || []);
    } catch (err) {
      alert("Failed to save text document.");
    } finally {
      setDocLoading(false);
    }
  };

  const handleDeleteDoc = async (id: number) => {
    if (!confirm("Delete this document?")) return;
    setDocLoading(true);
    try {
      await deleteDocument(id);
      await fetchData();
    } catch (err) {
      alert("Failed to delete document.");
    } finally {
      setDocLoading(false);
    }
  };

  // --- AI Revision ---
  const launchRevision = (doc: any) => {
    setTargetReviseDoc(doc);
    setRevisedContent('');
    setShowReviseModal(true);
  };

  const executeRevision = async () => {
    if (!targetReviseDoc) return;
    setRevising(true);
    try {
      const res = await reviseDocument(targetReviseDoc.content, targetReviseDoc.doc_type);
      setRevisedContent(res.revised_text);
    } catch (err) {
      alert("Failed to revise document");
    } finally {
      setRevising(false);
    }
  };

  const saveRevisedDocToProfile = async () => {
     if (!revisedContent) return;
     setDocLoading(true);
     try {
       await saveDocument(targetReviseDoc.doc_type, `Revised_${targetReviseDoc.name}`, revisedContent);
       await fetchData();
       setShowReviseModal(false);
     } catch (err) {
       alert("Failed to save revised document.");
     } finally {
       setDocLoading(false);
     }
  };

  const exportTextFile = (type: 'txt' | 'doc') => {
    if (!revisedContent) return;
    let content = revisedContent;
    let mime = 'text/plain';
    
    // Quick trick to generate an MS Word readable .doc file using HTML
    if (type === 'doc') {
      content = `
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #333; }
    p { font-size: 11pt; margin-bottom: 10px; }
    h1, h2, h3 { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
  </style>
</head>
<body>
  ${revisedContent.split('\n').map(l => {
     if (l.trim().startsWith('# ')) return `<h1>${l.replace(/^#\s*/, '')}</h1>`;
     if (l.trim().startsWith('## ')) return `<h2>${l.replace(/^##\s*/, '')}</h2>`;
     if (l.trim().startsWith('### ')) return `<h3>${l.replace(/^###\s*/, '')}</h3>`;
     if (l.trim() === '') return '<br>';
     return `<p>${l}</p>`;
  }).join('')}
</body>
</html>`;
      mime = 'application/msword';
    }
    
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Revised_${targetReviseDoc.name.split('.')[0]}.${type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const InputLabel = ({ children, required }: { children: React.ReactNode, required?: boolean }) => (
    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
      {children} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
    </label>
  );


  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px var(--shadow-color)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-heading)' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-muted)' }} className="mb-6">Please log in to view and edit your profile.</p>
          <Link href="/" className="px-6 py-2 rounded font-bold text-white transition-opacity hover:opacity-90" style={{ background: 'var(--accent)' }}>
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 transition-colors duration-300" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      
      {/* Top Banner */}
      <header className="sticky top-0 z-40 shadow-sm border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
               <Link href="/" className="flex items-center justify-center w-8 h-8 rounded-full transition-colors hover:bg-black/5" style={{ color: 'var(--text-muted)' }}>
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                 </svg>
               </Link>
               <h1 className="text-xl font-bold" style={{ color: 'var(--text-heading)' }}>Professional Profile Settings</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Decorative Banner */}
      <div className="h-32 w-full opacity-90 relative overflow-hidden shrink-0" style={{ background: 'linear-gradient(to right, var(--accent), var(--success))' }}>
         <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white opacity-20 rounded-full blur-2xl"></div>
         <div className="absolute top-10 left-20 w-32 h-32 bg-white opacity-20 rounded-full blur-xl"></div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 space-y-6">
        
        {loading ? (
             <div className="flex justify-center p-12 rounded-lg border shadow-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
               <div className="w-8 h-8 border-[3px] rounded-full animate-spin border-transparent border-t-[var(--accent)]" />
             </div>
        ) : (
          <>
            {/* Card 1: Contact Information */}
            <section className="rounded-md border shadow-sm overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
               <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
                 <h2 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>Contact Information</h2>
                 <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                   Linked exactly to your account credentials.
                 </p>
               </div>
               <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <InputLabel required>Account Email</InputLabel>
                    <input type="text" className="w-full border rounded text-sm px-3 py-2 outline-none opacity-60" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} value={user.email} disabled />
                  </div>
                  <div>
                    <InputLabel>Contact Email</InputLabel>
                    <input type="text" className="w-full border rounded text-sm px-3 py-2 outline-none focus:ring-1" 
                           style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                           value={profile.email} onChange={handleChange('email')} placeholder="name@example.com" />
                  </div>
                  <div>
                    <InputLabel>First Name</InputLabel>
                    <input type="text" className="w-full border rounded text-sm px-3 py-2 outline-none focus:ring-1" 
                           style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                           value={profile.first_name} onChange={handleChange('first_name')} placeholder="John" />
                  </div>
                  <div>
                    <InputLabel>Last Name</InputLabel>
                    <input type="text" className="w-full border rounded text-sm px-3 py-2 outline-none focus:ring-1" 
                           style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                           value={profile.last_name} onChange={handleChange('last_name')} placeholder="Doe" />
                  </div>
                  <div>
                    <InputLabel>Phone Number</InputLabel>
                    <input type="text" className="w-full border rounded text-sm px-3 py-2 outline-none focus:ring-1" 
                           style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                           value={profile.phone} onChange={handleChange('phone')} placeholder="(555) 123-4567" />
                  </div>
                  <div>
                    <InputLabel>LinkedIn URL</InputLabel>
                    <input type="text" className="w-full border rounded text-sm px-3 py-2 outline-none focus:ring-1" 
                           style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                           value={profile.linkedin} onChange={handleChange('linkedin')} placeholder="linkedin.com/in/john" />
                  </div>
                  <div>
                    <InputLabel>Portfolio / Website</InputLabel>
                    <input type="text" className="w-full border rounded text-sm px-3 py-2 outline-none focus:ring-1" 
                           style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                           value={profile.portfolio} onChange={handleChange('portfolio')} placeholder="github.com/john" />
                  </div>
               </div>
            </section>

            {/* Card 2: My Documents */}
            <section className="rounded-md border shadow-sm overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
               <div className="px-6 py-5 border-b flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
                 <div>
                   <h2 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>My Documents & AI Suite</h2>
                   <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Store Resumes and Cover Letters. Use our AI service to polish your drafts!</p>
                 </div>
                 {docLoading && <div className="w-5 h-5 border-[2px] rounded-full animate-spin border-transparent" style={{ borderTopColor: 'var(--accent)' }} />}
               </div>
               <div className="p-6 space-y-4">
                  
                  <div className="flex gap-4">
                     <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx,.txt" onChange={onFileInputChange} />
                     <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 border rounded hover:opacity-80 text-sm font-medium transition-opacity" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                        Upload Document
                     </button>
                     <button type="button" onClick={() => setShowPasteModal(true)} className="px-4 py-2 border rounded hover:opacity-80 text-sm font-medium transition-opacity" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                        Paste Plain Text
                     </button>
                  </div>

                  {documents.length > 0 ? (
                    <div className="mt-6 border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                      <table className="w-full text-left text-sm">
                        <thead className="text-xs uppercase" style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
                          <tr>
                            <th className="px-4 py-3 font-semibold">Document Name</th>
                            <th className="px-4 py-3 font-semibold">Type</th>
                            <th className="px-4 py-3 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
                           {documents.map((doc: any) => (
                             <tr key={doc.id} className="hover:bg-black/5" style={{ color: 'var(--text-primary)' }}>
                               <td className="px-4 py-3 font-medium flex items-center gap-2">
                                  <svg className="w-4 h-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                  </svg>
                                  {doc.name}
                               </td>
                               <td className="px-4 py-3 capitalize">{doc.doc_type.replace('_', ' ')}</td>
                               <td className="px-4 py-3 text-right space-x-2">
                                  <button onClick={() => launchRevision(doc)} title="Revise with AI" className="p-1.5 rounded transition-colors inline-block hover:bg-purple-100 text-purple-600">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                  </button>
                                  <button onClick={() => handleDeleteDoc(doc.id)} title="Delete" className="p-1.5 rounded transition-colors inline-block hover:bg-red-100 text-red-500">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                               </td>
                             </tr>
                           ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center border-2 border-dashed rounded-lg mt-2" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                       <p className="text-sm">No documents saved. Upload your first file above.</p>
                    </div>
                  )}

               </div>
            </section>

            {/* Card 3: Experience & Additional Details */}
            <section className="rounded-md border shadow-sm overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
               <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
                 <h2 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>Work Experience</h2>
                 <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>List your positions so our system can reference them easily.</p>
               </div>
               
               <div className="p-6 space-y-6">
                 
                 {experiences.map((exp, index) => (
                   <div key={index} className="border rounded-md p-5 relative" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-primary)' }}>
                     {experiences.length > 1 && (
                       <button onClick={() => removeExperience(index)} className="absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100">
                         Remove
                       </button>
                     )}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-16">
                        <div>
                           <InputLabel>Company</InputLabel>
                           <input type="text" className="w-full border rounded px-3 py-2 text-sm outline-none" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }} placeholder="E.g., Global Modern Services" value={exp.company} onChange={e => handleExpChange(index, 'company', e.target.value)} />
                        </div>
                        <div>
                           <InputLabel>Job Title</InputLabel>
                           <input type="text" className="w-full border rounded px-3 py-2 text-sm outline-none" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }} placeholder="Senior Manager" value={exp.title} onChange={e => handleExpChange(index, 'title', e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                           <InputLabel>Location / Duration</InputLabel>
                           <input type="text" className="w-full border rounded px-3 py-2 text-sm outline-none" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }} placeholder="Boston, MA | 2018 - Present" value={exp.location} onChange={e => handleExpChange(index, 'location', e.target.value)} />
                        </div>
                     </div>
                     <div>
                       <InputLabel>Role Description</InputLabel>
                       <textarea className="w-full min-h-[100px] border rounded px-3 py-2 text-sm outline-none resize-y" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }} placeholder="Managed a large team, increased revenue..." value={exp.description} onChange={e => handleExpChange(index, 'description', e.target.value)} />
                     </div>
                   </div>
                 ))}

                 <button type="button" onClick={addExperience} className="px-4 py-2 border border-dashed rounded font-bold text-sm w-full transition-opacity hover:opacity-80 flex items-center justify-center gap-2" style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--nav-bg)' }}>
                    <span>+</span> Add Another Role
                 </button>

                 <div className="border-t pt-6" style={{ borderColor: 'var(--border-color)' }}>
                   <div className="mb-6">
                     <InputLabel>Skills Catalog (Comma Separated)</InputLabel>
                     <textarea className="w-full min-h-[80px] border rounded px-3 py-2 text-sm outline-none resize-y" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }} placeholder="Python, Data Analysis, CRM..." value={profile.skills} onChange={handleChange('skills')} />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <InputLabel>Education</InputLabel>
                        <textarea className="w-full min-h-[80px] border rounded p-3 text-sm outline-none" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }} value={profile.coursework} onChange={handleChange('coursework')} />
                      </div>
                      <div>
                        <InputLabel>Certifications</InputLabel>
                        <textarea className="w-full min-h-[80px] border rounded p-3 text-sm outline-none" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }} value={profile.certifications} onChange={handleChange('certifications')} />
                      </div>
                   </div>
                 </div>

               </div>
            </section>
          </>
        )}
      </main>

      {/* Sticky Bottom Action Bar */}
      {!loading && (
        <div className="fixed bottom-0 left-0 w-full border-t p-4 z-40" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', boxShadow: '0 -4px 6px -1px var(--shadow-color)' }}>
          <div className="max-w-4xl mx-auto flex items-center gap-3">
             <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded font-bold text-sm text-white transition-opacity hover:opacity-90 min-w-[120px]" style={{ background: 'var(--accent)' }}>
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0 mx-auto" />
                ) : (
                  "Save Details"
                )}
             </button>
             <Link href="/" className="px-5 py-2.5 bg-transparent border rounded font-bold text-sm transition-colors hover:bg-black/5 inline-block" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                Return Home
             </Link>
             {message && (
               <div className={`ml-auto text-sm font-bold ${message.includes('success') ? 'text-green-500' : 'text-red-500'} animate-fade-in`}>
                 {message}
               </div>
             )}
          </div>
        </div>
      )}

      {/* UPLOAD TYPE MODAL */}
      {showTypeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-xl shadow-2xl w-full max-w-sm overflow-hidden" style={{ background: 'var(--bg-card)' }}>
             <div className="px-6 py-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
               <h3 className="font-bold text-lg" style={{ color: 'var(--text-heading)' }}>Document Type</h3>
               <button onClick={() => setShowTypeModal(false)} className="opacity-50 hover:opacity-100" style={{ color: 'var(--text-primary)' }}>×</button>
             </div>
             <div className="p-6">
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Classify <b>{pendingFile?.name}</b></p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-black/5 transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                    <input type="radio" value="resume" checked={uploadDocType === 'resume'} onChange={() => setUploadDocType('resume')} className="w-4 h-4" />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Resume</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-black/5 transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                    <input type="radio" value="cover_letter" checked={uploadDocType === 'cover_letter'} onChange={() => setUploadDocType('cover_letter')} className="w-4 h-4" />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Cover Letter</span>
                  </label>
                </div>
             </div>
             <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                <button onClick={() => setShowTypeModal(false)} className="px-4 py-2 text-sm font-medium hover:opacity-80" style={{ color: 'var(--text-muted)' }}>Cancel</button>
                <button onClick={confirmFileUpload} className="px-6 py-2 text-sm font-bold text-white rounded hover:opacity-90" style={{ background: 'var(--accent)' }}>Upload</button>
             </div>
          </div>
        </div>
      )}

      {/* PASTE MODAL */}
      {showPasteModal && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
           <div className="rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden" style={{ background: 'var(--bg-card)' }}>
              <div className="px-6 py-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
                 <h3 className="font-bold text-lg" style={{ color: 'var(--text-heading)' }}>Save Text Document</h3>
                 <button onClick={() => setShowPasteModal(false)} className="opacity-50 hover:opacity-100 pl-4 text-xl" style={{ color: 'var(--text-primary)' }}>×</button>
              </div>
              <div className="p-6 space-y-4">
                 <div className="flex gap-4">
                   <div className="flex-1">
                     <InputLabel>Document Name</InputLabel>
                     <input type="text" className="w-full border rounded px-3 py-2 text-sm outline-none" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} value={pasteName} onChange={e => setPasteName(e.target.value)} />
                   </div>
                   <div className="w-1/3">
                     <InputLabel>Type</InputLabel>
                     <select className="w-full border rounded px-3 py-2 text-sm outline-none" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} value={pasteType} onChange={e => setPasteType(e.target.value)}>
                        <option value="resume">Resume</option>
                        <option value="cover_letter">Cover Letter</option>
                     </select>
                   </div>
                 </div>
                 <div>
                   <InputLabel>Content</InputLabel>
                   <textarea className="w-full min-h-[200px] border rounded px-3 py-2 text-sm outline-none font-mono resize-y" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} value={pasteContent} onChange={e => setPasteContent(e.target.value)} />
                 </div>
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                 <button onClick={() => setShowPasteModal(false)} className="px-4 py-2 text-sm font-medium hover:opacity-80" style={{ color: 'var(--text-muted)' }}>Cancel</button>
                 <button onClick={handlePasteSave} disabled={docLoading} className="px-6 py-2 text-sm font-bold text-white rounded hover:opacity-90" style={{ background: 'var(--accent)' }}>
                    Save Document
                 </button>
              </div>
           </div>
         </div>
      )}

      {/* AI REVISION MODAL */}
      {showReviseModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
           <div className="rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" style={{ background: 'var(--bg-card)' }}>
              
              <div className="px-6 py-4 border-b flex justify-between items-center shrink-0" style={{ borderColor: 'var(--border-color)', background: 'var(--nav-bg)' }}>
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #a855f7, var(--accent))' }}>
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                   </div>
                   <h3 className="font-bold text-lg" style={{ color: 'var(--text-heading)' }}>AI Document Editor</h3>
                 </div>
                 <button onClick={() => setShowReviseModal(false)} className="opacity-50 hover:opacity-100 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>×</button>
              </div>
              
              <div className="p-6 flex-1 overflow-y-auto space-y-4">
                 <div className="flex items-center justify-between">
                   <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Editing: <span className="opacity-70">{targetReviseDoc?.name}</span></p>
                   {!revisedContent && (
                     <button onClick={executeRevision} disabled={revising} className="px-4 py-2 rounded text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2" style={{ background: 'linear-gradient(to right, #a855f7, var(--accent))' }}>
                       {revising ? 'AI is Rewriting...' : 'Magic Rewrite Text'}
                     </button>
                   )}
                 </div>

                 <textarea 
                    className="w-full h-full min-h-[400px] border rounded p-4 text-sm outline-none font-sans" 
                    style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)', lineHeight: '1.6' }} 
                    placeholder="Hit the rewrite button to let the AI rewrite your document text, or manually edit it right here."
                    value={revisedContent || targetReviseDoc?.content} 
                    onChange={e => setRevisedContent(e.target.value)} 
                 />
              </div>

              {revisedContent && (
                <div className="px-6 py-4 border-t flex flex-wrap justify-between items-center gap-4 shrink-0" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                  <div className="flex gap-2">
                     <button onClick={() => exportTextFile('txt')} className="px-4 py-2 border rounded text-sm font-medium hover:opacity-80 transition flex items-center gap-2" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export .txt
                     </button>
                     <button onClick={() => exportTextFile('doc')} className="px-4 py-2 border rounded text-sm font-medium hover:opacity-80 transition flex items-center gap-2" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: '#2563eb' }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export .doc
                     </button>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => setRevisedContent('')} className="px-4 py-2 text-sm hover:underline" style={{ color: 'var(--text-muted)' }}>Discard</button>
                     <button onClick={saveRevisedDocToProfile} className="px-6 py-2 text-sm font-bold text-white rounded hover:opacity-90" style={{ background: 'var(--success)' }}>
                        Save as New Doc
                     </button>
                  </div>
                </div>
              )}

           </div>
        </div>
      )}

    </div>
  );
}
