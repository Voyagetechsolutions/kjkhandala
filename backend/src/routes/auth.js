const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/supabase');

function setSessionCookies(res, session) {
  if (!session?.access_token || !session?.refresh_token) return;
  const secure = process.env.NODE_ENV === 'production';
  const sameSite = secure ? 'none' : 'lax';
  res.cookie('sb-access-token', session.access_token, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
  res.cookie('sb-refresh-token', session.refresh_token, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

async function fetchProfileAndRoles(userId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  const { data: rolesData } = await supabase
    .from('user_roles')
    .select('role, role_level, is_active')
    .eq('user_id', userId)
    .eq('is_active', true);
  const roles = rolesData?.map((r) => r.role) || [];
  const role = roles[0];
  const userResponse = {
    id: userId,
    email: profile?.email || null,
    firstName: profile?.full_name?.split(' ')?.[0] || null,
    lastName: profile?.full_name?.split(' ')?.slice(1).join(' ') || null,
    phone: profile?.phone || null,
    role: role || 'PASSENGER',
    userRoles: rolesData?.map((r) => ({ role: r.role, roleLevel: r.role_level })) || [],
  };
  return userResponse;
}

// Register
router.post('/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, firstName, lastName, phone } = req.body;

      // Create user via Supabase Admin
      const { data: created, error: cErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: `${firstName} ${lastName}`.trim(), phone },
      });
      if (cErr) return res.status(400).json({ error: cErr.message });
      const userId = created.user?.id;
      if (!userId) return res.status(500).json({ error: 'User creation failed' });

      // Ensure profile and default role
      await supabase.from('profiles').upsert({
        id: userId,
        email,
        full_name: `${firstName} ${lastName}`.trim(),
        phone,
      }, { onConflict: 'id' });
      await supabase.from('user_roles').upsert({
        user_id: userId,
        role: 'PASSENGER',
        role_level: 0,
        is_active: true,
      }, { onConflict: 'user_id,role' });

      // No automatic login; require email verification or explicit login
      const userResponse = await fetchProfileAndRoles(userId);
      res.status(201).json({ user: userResponse });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Login
router.post('/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return res.status(401).json({ error: error.message });
      setSessionCookies(res, data.session);
      const userId = data.user?.id;
      const userResponse = await fetchProfileAndRoles(userId);
      res.json({ user: userResponse });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('sb-access-token', { path: '/' });
  res.clearCookie('sb-refresh-token', { path: '/' });
  res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies['sb-access-token'] || req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ error: 'Invalid token' });
    const userResponse = await fetchProfileAndRoles(data.user.id);
    res.json({ user: userResponse });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
