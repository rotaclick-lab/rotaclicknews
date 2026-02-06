'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { userProfileSchema, companySettingsSchema, notificationSettingsSchema } from '@/lib/validations/settings.schema'
import type { UserProfileFormData, CompanySettingsFormData, NotificationSettingsFormData } from '@/lib/validations/settings.schema'

// Update user profile
export async function updateUserProfile(formData: UserProfileFormData) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    const validatedData = userProfileSchema.parse(formData)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: validatedData.full_name,
        phone: validatedData.phone,
        avatar_url: validatedData.avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      console.error('Error updating profile:', error)
      return { success: false, error: 'Erro ao atualizar perfil' }
    }

    revalidatePath('/configuracoes')

    return { success: true }
  } catch (error: any) {
    console.error('Error in updateUserProfile:', error)
    if (error.errors) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao atualizar perfil' }
  }
}

// Update company settings
export async function updateCompanySettings(formData: CompanySettingsFormData) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return { success: false, error: 'Empresa não encontrada' }
    }

    if (profile.role !== 'admin') {
      return { success: false, error: 'Apenas administradores podem alterar configurações da empresa' }
    }

    const validatedData = companySettingsSchema.parse(formData)

    const { error } = await supabase
      .from('companies')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.company_id)

    if (error) {
      console.error('Error updating company:', error)
      return { success: false, error: 'Erro ao atualizar empresa' }
    }

    revalidatePath('/configuracoes')

    return { success: true }
  } catch (error: any) {
    console.error('Error in updateCompanySettings:', error)
    if (error.errors) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao atualizar empresa' }
  }
}

// Update notification settings
export async function updateNotificationSettings(formData: NotificationSettingsFormData) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    const validatedData = notificationSettingsSchema.parse(formData)

    // Check if settings exist
    const { data: existing } = await supabase
      .from('notification_settings')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('notification_settings')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (error) {
        console.error('Error updating notifications:', error)
        return { success: false, error: 'Erro ao atualizar notificações' }
      }
    } else {
      const { error } = await supabase
        .from('notification_settings')
        .insert({
          user_id: user.id,
          ...validatedData,
        })

      if (error) {
        console.error('Error creating notifications:', error)
        return { success: false, error: 'Erro ao criar configurações de notificação' }
      }
    }

    revalidatePath('/configuracoes')

    return { success: true }
  } catch (error: any) {
    console.error('Error in updateNotificationSettings:', error)
    if (error.errors) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao atualizar notificações' }
  }
}

// Change password
export async function changePassword(currentPassword: string, newPassword: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    })

    if (signInError) {
      return { success: false, error: 'Senha atual incorreta' }
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      console.error('Error updating password:', error)
      return { success: false, error: 'Erro ao alterar senha' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in changePassword:', error)
    return { success: false, error: 'Erro ao alterar senha' }
  }
}

// Get user profile
export async function getUserProfile() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return { success: false, error: 'Erro ao buscar perfil' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return { success: false, error: 'Erro ao buscar perfil' }
  }
}

// Get company settings
export async function getCompanySettings() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return { success: false, error: 'Empresa não encontrada' }
    }

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single()

    if (error) {
      console.error('Error fetching company:', error)
      return { success: false, error: 'Erro ao buscar empresa' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getCompanySettings:', error)
    return { success: false, error: 'Erro ao buscar empresa' }
  }
}

// Get notification settings
export async function getNotificationSettings() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching notifications:', error)
      return { success: false, error: 'Erro ao buscar notificações' }
    }

    // Return defaults if not found
    if (!data) {
      return {
        success: true,
        data: {
          email_notifications: true,
          freight_updates: true,
          payment_reminders: true,
          document_expiration: true,
          new_marketplace_routes: false,
          proposal_updates: true,
          system_updates: true,
        },
      }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getNotificationSettings:', error)
    return { success: false, error: 'Erro ao buscar notificações' }
  }
}
