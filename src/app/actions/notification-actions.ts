'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { NotificationType } from '@/types/notification.types'

// List notifications for current user
export async function listNotifications(limit: number = 20, unreadOnly: boolean = false) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error listing notifications:', error)
      return { success: false, error: 'Erro ao buscar notificações' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in listNotifications:', error)
    return { success: false, error: 'Erro ao buscar notificações' }
  }
}

// Get unread count
export async function getUnreadCount() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)

    if (error) {
      console.error('Error getting unread count:', error)
      return { success: false, error: 'Erro ao contar notificações' }
    }

    return { success: true, data: count || 0 }
  } catch (error) {
    console.error('Error in getUnreadCount:', error)
    return { success: false, error: 'Erro ao contar notificações' }
  }
}

// Mark notification as read
export async function markAsRead(notificationId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error marking as read:', error)
      return { success: false, error: 'Erro ao marcar como lida' }
    }

    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error in markAsRead:', error)
    return { success: false, error: 'Erro ao marcar como lida' }
  }
}

// Mark all as read
export async function markAllAsRead() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('read', false)

    if (error) {
      console.error('Error marking all as read:', error)
      return { success: false, error: 'Erro ao marcar todas como lidas' }
    }

    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error in markAllAsRead:', error)
    return { success: false, error: 'Erro ao marcar todas como lidas' }
  }
}

// Create notification
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
  metadata?: any
) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        link,
        metadata,
        read: false,
      })

    if (error) {
      console.error('Error creating notification:', error)
      return { success: false, error: 'Erro ao criar notificação' }
    }

    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error in createNotification:', error)
    return { success: false, error: 'Erro ao criar notificação' }
  }
}

// Delete notification
export async function deleteNotification(notificationId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting notification:', error)
      return { success: false, error: 'Erro ao excluir notificação' }
    }

    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error in deleteNotification:', error)
    return { success: false, error: 'Erro ao excluir notificação' }
  }
}
