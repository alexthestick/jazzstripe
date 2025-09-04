import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const Comments = ({ postId, isOpen, onClose, user, getInitial, formatTimestamp }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchComments();
        }
    }, [isOpen, postId, fetchComments]);

    const fetchComments = useCallback(async () => {
        const { data, error } = await supabase
            .from('comments')
            .select(`
                *,
                profiles:user_id (username)
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setComments(data);
        }
    }, [postId]);

    const submitComment = async (e) => {
        e.preventDefault();
        if (!user || !newComment.trim()) return;

        setLoading(true);
        const { error } = await supabase
            .from('comments')
            .insert({
                post_id: postId,
                user_id: user.id,
                content: newComment.trim()
            });

        if (!error) {
            setNewComment('');
            fetchComments();
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="comments-modal" style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'var(--bg, white)',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
            maxHeight: '70vh',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{
                padding: '20px',
                borderBottom: '1px solid var(--border, #e0e0e0)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h3>Comments</h3>
                <button onClick={onClose} style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer'
                }}>×</button>
            </div>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px'
            }}>
                {comments.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#999' }}>
                        No comments yet. Be the first!
                    </p>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} style={{
                            marginBottom: '16px',
                            display: 'flex',
                            gap: '12px'
                        }}>
                            <div className="avatar" style={{ flexShrink: 0 }}>
                                {getInitial(comment.profiles?.username)}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontWeight: 'bold',
                                    marginBottom: '4px'
                                }}>
                                    {comment.profiles?.username}
                                </div>
                                <div>{comment.content}</div>
                                <div style={{
                                    fontSize: '12px',
                                    color: '#999',
                                    marginTop: '4px'
                                }}>
                                    {formatTimestamp(comment.created_at)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {user && (
                <form onSubmit={submitComment} style={{
                    padding: '20px',
                    borderTop: '1px solid var(--border, #e0e0e0)',
                    display: 'flex',
                    gap: '12px'
                }}>
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        style={{
                            flex: 1,
                            padding: '10px',
                            border: '1px solid var(--border, #e0e0e0)',
                            borderRadius: '20px',
                            outline: 'none'
                        }}
                    />
                    <button
                        type="submit"
                        className="btn"
                        disabled={loading || !newComment.trim()}
                    >
                        Post
                    </button>
                </form>
            )}
        </div>
    );
};

export default Comments;
