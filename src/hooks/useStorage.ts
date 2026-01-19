import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useUploadAvatar = () => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user?.id) return null;

    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete existing avatar if any
      await supabase.storage.from('avatars').remove([fileName]);

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return `${data.publicUrl}?t=${Date.now()}`;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return { uploadAvatar, uploading };
};

export const useUploadChatImage = () => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File, conversationId: string): Promise<string | null> => {
    if (!user?.id) return null;

    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${conversationId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return { uploadImage, uploading };
};
