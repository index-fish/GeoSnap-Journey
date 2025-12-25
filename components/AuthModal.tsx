
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { User, Mail, Lock, Loader2, Camera, ArrowRight, X } from 'lucide-react';

const AuthModal: React.FC = () => {
  const { login, register } = useAuth();
  const { language } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const t = {
    en: {
      title: isLogin ? 'Welcome Back' : 'Join GeoSnap',
      subtitle: isLogin ? 'Login to access your journey log' : 'Start mapping your photographic adventures',
      name: 'Full Name',
      email: 'Email Address',
      password: 'Password',
      submit: isLogin ? 'Login' : 'Create Account',
      toggle: isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login",
    },
    zh: {
      title: isLogin ? '欢迎回来' : '加入 GeoSnap',
      subtitle: isLogin ? '登录以访问您的旅行日志' : '开始记录您的摄影冒险',
      name: '姓名',
      email: '电子邮箱',
      password: '密码',
      submit: isLogin ? '登录' : '创建账号',
      toggle: isLogin ? "没有账号？立即注册" : "已有账号？立即登录",
    }
  }[language as 'en' | 'zh'];

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200 mb-4">
              <Camera size={32} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t.title}</h2>
            <p className="text-gray-500 mt-2 text-sm">{t.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl animate-shake">
                {error}
              </div>
            )}

            {!isLogin && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  required
                  type="text"
                  placeholder={t.name}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                required
                type="email"
                placeholder={t.email}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                required
                type="password"
                placeholder={t.password}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  {t.submit}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full mt-6 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors"
          >
            {t.toggle}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
