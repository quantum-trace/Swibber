import { apiClient } from '../api/client';

export const UploadService = {
  async uploadAvatar(uri: string): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    const fileName = uri.split('/').pop() ?? 'avatar.jpg';
    const match = /\.(\w+)$/.exec(fileName);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    formData.append('avatar', { uri, name: fileName, type } as unknown as Blob);

    const { data } = await apiClient.post('/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return { avatarUrl: data.data.avatarUrl };
  },
};
