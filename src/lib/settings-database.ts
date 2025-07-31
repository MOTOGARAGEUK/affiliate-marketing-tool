import { createServerClient } from './supabase';

// Get server client for database operations (singleton)
const getSupabase = () => createServerClient();

// Settings API
export const settingsAPI = {
  async getAll(userId: string) {
    const { data, error } = await getSupabase()
      .from('settings')
      .select('setting_type, setting_key, setting_value')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  },

  async getByType(userId: string, settingType: string) {
    const { data, error } = await getSupabase()
      .from('settings')
      .select('setting_key, setting_value')
      .eq('user_id', userId)
      .eq('setting_type', settingType);

    if (error) throw error;
    return data;
  },

  async set(userId: string, settingType: string, settingKey: string, value: any) {
    const { data, error } = await getSupabase()
      .from('settings')
      .upsert({
        user_id: userId,
        setting_type: settingType,
        setting_key: settingKey,
        setting_value: value
      })
      .select('setting_type, setting_key, setting_value')
      .single();

    if (error) throw error;
    return data;
  },

  async setMultiple(userId: string, settingType: string, settings: Record<string, any>) {
    const settingsArray = Object.entries(settings).map(([key, value]) => ({
      user_id: userId,
      setting_type: settingType,
      setting_key: key,
      setting_value: value
    }));

    const { data, error } = await getSupabase()
      .from('settings')
      .upsert(settingsArray)
      .select('setting_type, setting_key, setting_value');

    if (error) throw error;
    return data;
  },

  async delete(userId: string, settingType: string, settingKey: string) {
    const { error } = await getSupabase()
      .from('settings')
      .delete()
      .eq('user_id', userId)
      .eq('setting_type', settingType)
      .eq('setting_key', settingKey);

    if (error) throw error;
    return true;
  }
}; 