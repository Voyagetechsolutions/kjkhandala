const { supabase } = require('../config/supabase');

const auth = async (req, res, next) => {
  try {
    // Prefer Supabase cookie, then Authorization header
    const token = req.cookies['sb-access-token'] || req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ error: 'Invalid token' });

    const userId = data.user.id;
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone')
      .eq('id', userId)
      .single();
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('role, role_level')
      .eq('user_id', userId)
      .eq('is_active', true);

    req.user = {
      id: userId,
      email: profile?.email || data.user.email || null,
      firstName: profile?.full_name?.split(' ')?.[0] || null,
      lastName: profile?.full_name?.split(' ')?.slice(1).join(' ') || null,
      role: rolesData?.[0]?.role || 'PASSENGER',
      roles: (rolesData || []).map((r) => r.role),
      roleLevel: rolesData && rolesData.length ? Math.max(...rolesData.map((r) => r.role_level || 0)) : 0,
    };
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const allowed = Array.isArray(roles) && roles.length === 1 && Array.isArray(roles[0])
      ? roles[0]
      : roles;

    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
};

module.exports = { 
  auth, 
  authenticate: auth, // Alias for consistency
  authorize 
};
