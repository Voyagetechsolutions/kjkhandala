const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

// Get all users
router.get('/', auth, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, created_at, updated_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const users = (profiles || []).map((p) => ({
      id: p.id,
      email: p.email,
      firstName: p.full_name?.split(' ')?.[0] || null,
      lastName: p.full_name?.split(' ')?.slice(1).join(' ') || null,
      phone: p.phone || null,
      role: undefined,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    res.json({ data: users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    // Users can only view their own profile unless they're admin
    if (req.user.id !== req.params.id && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, created_at, updated_at')
      .eq('id', req.params.id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = {
      id: profile.id,
      email: profile.email,
      firstName: profile.full_name?.split(' ')?.[0] || null,
      lastName: profile.full_name?.split(' ')?.slice(1).join(' ') || null,
      phone: profile.phone || null,
      role: undefined,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };

    res.json({ data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/:id', auth, async (req, res) => {
  try {
    // Users can only update their own profile unless they're admin
    if (req.user.id !== req.params.id && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { email, firstName, lastName, phone } = req.body;
    const full_name = [firstName, lastName].filter(Boolean).join(' ').trim();
    const { data, error } = await supabase
      .from('profiles')
      .update({ email, full_name, phone })
      .eq('id', req.params.id)
      .select('id, email, full_name, phone')
      .single();
    if (error) throw error;
    const user = {
      id: data.id,
      email: data.email,
      firstName: data.full_name?.split(' ')?.[0] || null,
      lastName: data.full_name?.split(' ')?.slice(1).join(' ') || null,
      phone: data.phone || null,
      role: undefined,
    };

    res.json({ data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user role (admin only)
router.patch('/:id/role', auth, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const { role } = req.body;
    // upsert into user_roles
    const { error } = await supabase
      .from('user_roles')
      .upsert({ user_id: req.params.id, role, role_level: 0, is_active: true }, { onConflict: 'user_id,role' });
    if (error) throw error;
    res.json({ data: { id: req.params.id, role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    // soft delete: deactivate roles and anonymize profile
    await supabase.from('user_roles').update({ is_active: false }).eq('user_id', req.params.id);
    await supabase.from('profiles').update({ full_name: 'Deleted User', email: null, phone: null }).eq('id', req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
