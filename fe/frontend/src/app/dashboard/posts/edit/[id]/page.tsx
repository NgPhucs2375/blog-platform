'use client';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import PostComposer from '@/components/PostComposer';
export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  return <ProtectedRoute><PostComposer postId={id} /></ProtectedRoute>;
}
