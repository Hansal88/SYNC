import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, X, Trash2, Save } from 'lucide-react';

const TutorNotes = () => {
  const { isDark } = useOutletContext();
  const [notes, setNotes] = useState([
    { id: 1, title: "Student Feedback", content: "Mark is struggling with React Hooks. Focus on useEffect.", date: "Oct 23" },
  ]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState({ title: "", content: "" });
  const [isEditing, setIsEditing] = useState(false);

  const openCreateModal = () => {
    setCurrentNote({ title: "", content: "" });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (note) => {
    setCurrentNote(note);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSaveNote = () => {
    if (!currentNote.title.trim()) return;
    if (isEditing) {
      setNotes(notes.map(n => n.id === currentNote.id ? currentNote : n));
    } else {
      const newNote = {
        ...currentNote,
        id: Date.now(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
      setNotes([newNote, ...notes]);
    }
    setIsModalOpen(false);
  };

  const deleteNote = (id, e) => {
    e.stopPropagation();
    setNotes(notes.filter(n => n.id !== id));
  };

  return (
    <div className="relative min-h-[80vh] transition-colors duration-500">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">My Notes</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Click any note to edit its content</p>
        </div>
        
        <button 
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95"
        >
          <Plus size={20} /> New Note
        </button>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.map(note => (
          <div 
            key={note.id} 
            onClick={() => openEditModal(note)}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{note.date}</span>
              <button 
                onClick={(e) => deleteNote(note.id, e)}
                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mt-2 mb-3 transition-colors">{note.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 transition-colors">{note.content}</p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 w-full max-w-lg relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {isEditing ? "Edit Note" : "Create New Note"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-2">Title</label>
                <input 
                  type="text" 
                  value={currentNote.title}
                  onChange={(e) => setCurrentNote({...currentNote, title: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3 text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-2">Content</label>
                <textarea 
                  rows="5"
                  value={currentNote.content}
                  onChange={(e) => setCurrentNote({...currentNote, content: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3 text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveNote}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-blue-100 dark:shadow-none hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {isEditing ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorNotes;