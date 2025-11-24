'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Reply,
  MoreVertical,
  Trash2,
  Edit,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { useToastHelpers } from '@/components/toast';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  content: string;
  userId: string;
  user: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  parentId?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

interface DocumentCommentsProps {
  documentId: string;
  spaceSlug: string;
  currentUserId: string;
  onCommentCreate?: (comment: Comment) => void;
  onCommentResolve?: (commentId: string) => void;
}

export function DocumentComments({
  documentId,
  spaceSlug,
  currentUserId,
  onCommentCreate,
  onCommentResolve,
}: DocumentCommentsProps) {
  const { success: showSuccess, error: showError } = useToastHelpers();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    fetchComments();
  }, [documentId, spaceSlug]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/spaces/${spaceSlug}/documents/${documentId}/comments`,
        { credentials: 'include' }
      );
      const data = await response.json();

      if (data.success) {
        // Organize comments into threads
        const topLevel = data.comments.filter((c: Comment) => !c.parentId);
        const replies = data.comments.filter((c: Comment) => c.parentId);
        
        const organized = topLevel.map((comment: Comment) => ({
          ...comment,
          replies: replies.filter((r: Comment) => r.parentId === comment.id),
        }));

        setComments(organized);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      showError('Error', 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(
        `/api/spaces/${spaceSlug}/documents/${documentId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ content: newComment }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setNewComment('');
        await fetchComments();
        onCommentCreate?.(data.comment);
        showSuccess('Success', 'Comment added');
      } else {
        throw new Error(data.message || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      showError('Error', 'Failed to add comment');
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    try {
      const response = await fetch(
        `/api/spaces/${spaceSlug}/documents/${documentId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ content: replyContent, parentId }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setReplyContent('');
        setReplyingTo(null);
        await fetchComments();
        showSuccess('Success', 'Reply added');
      } else {
        throw new Error(data.message || 'Failed to add reply');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      showError('Error', 'Failed to add reply');
    }
  };

  const handleResolve = async (commentId: string) => {
    try {
      const response = await fetch(
        `/api/spaces/${spaceSlug}/documents/${documentId}/comments/${commentId}/resolve`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchComments();
        onCommentResolve?.(commentId);
        showSuccess('Success', 'Comment resolved');
      } else {
        throw new Error(data.message || 'Failed to resolve comment');
      }
    } catch (error) {
      console.error('Error resolving comment:', error);
      showError('Error', 'Failed to resolve comment');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(
        `/api/spaces/${spaceSlug}/documents/${documentId}/comments/${commentId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchComments();
        showSuccess('Success', 'Comment deleted');
      } else {
        throw new Error(data.message || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      showError('Error', 'Failed to delete comment');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading comments...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Comment Input */}
      <div className="space-y-2">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end">
          <Button onClick={handleSubmitComment} disabled={!newComment.trim()}>
            <Send className="w-4 h-4 mr-2" />
            Comment
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onReply={() => setReplyingTo(comment.id)}
              onResolve={() => handleResolve(comment.id)}
              onDelete={() => handleDelete(comment.id)}
              spaceSlug={spaceSlug}
              documentId={documentId}
            />
          ))
        )}
      </div>

      {/* Reply Input */}
      {replyingTo && (
        <Card>
          <CardContent className="p-4">
            <Textarea
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={2}
              className="mb-2"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleSubmitReply(replyingTo)}
                disabled={!replyContent.trim()}
              >
                Reply
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  currentUserId,
  onReply,
  onResolve,
  onDelete,
  spaceSlug,
  documentId,
}: {
  comment: Comment;
  currentUserId: string;
  onReply: () => void;
  onResolve: () => void;
  onDelete: () => void;
  spaceSlug: string;
  documentId: string;
}) {
  const isOwner = comment.userId === currentUserId;
  const isResolved = comment.resolved;

  return (
    <Card className={cn(isResolved && 'opacity-60')}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={comment.user.avatar} />
            <AvatarFallback>
              {comment.user.name?.[0] || comment.user.email[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">
                {comment.user.name || comment.user.email}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
              {isResolved && (
                <Badge variant="outline" className="text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Resolved
                </Badge>
              )}
            </div>
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={onReply}
                disabled={isResolved}
              >
                <Reply className="w-3 h-3 mr-1" />
                Reply
              </Button>
              {!isResolved && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={onResolve}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Resolve
                </Button>
              )}
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onDelete}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4 ml-4 space-y-3 border-l-2 pl-4">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="flex items-start gap-3">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={reply.user.avatar} />
                      <AvatarFallback>
                        {reply.user.name?.[0] || reply.user.email[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {reply.user.name || reply.user.email}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

