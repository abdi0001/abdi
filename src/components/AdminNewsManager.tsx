import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNews } from '../hooks/useNews';

export function AdminNewsManager() {
  const { articles } = useNews();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [message, setMessage] = useState('');

  const publishArticle = async () => {
    if (!title.trim()) { setMessage('Title is required.'); return; }
    if (!supabase) { setMessage('Supabase not configured.'); return; }
    const { error } = await supabase.from('news').insert({
      title: title.trim(),
      summary: summary.trim() || null,
      image_url: imageUrl.trim() || null,
      published: true,
      published_at: new Date().toISOString(),
    });
    if (error) setMessage('Error: ' + error.message);
    else { setMessage('Article published.'); setTitle(''); setSummary(''); setImageUrl(''); }
  };

  return (
    <div className="admin-console">
      <h3>ADMIN · NEWS MANAGER</h3>
      {message && <div className="admin-status">{message}</div>}
      <div className="admin-form">
        <input placeholder="Article title" value={title} onChange={e => setTitle(e.target.value)} />
        <input placeholder="Summary (optional)" value={summary} onChange={e => setSummary(e.target.value)} />
        <input placeholder="Image URL (optional)" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
        <button className="admin-action primary wide" onClick={publishArticle}>Publish article</button>
      </div>
      <p className="admin-note">Recent articles ({articles.length} published)</p>
      {articles.slice(0, 5).map(a => (
        <div className="admin-item" key={a.id}>
          <span>{a.title}<small> · {a.published_at ? new Date(a.published_at).toLocaleDateString() : 'unpublished'}</small></span>
        </div>
      ))}
    </div>
  );
}
