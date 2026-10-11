'use client';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import PostComposer from '@/components/PostComposer';
export default function CreatePostPage() {
  return <ProtectedRoute><PostComposer /></ProtectedRoute>;
}
