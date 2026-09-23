import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import ErrorMessage from '../components/ErrorMessage';
import { ROLES } from '../utils/constants';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: ROLES.BUYER });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await authService.register(form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <div>
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" required />
        <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" required />
        <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" required />
        <select name="role" value={form.role} onChange={handleChange}>
          <option value={ROLES.BUYER}>Buyer</option>
          <option value={ROLES.SUPPLIER}>Supplier</option>
        </select>
        <button type="submit">Register</button>
      </form>
      <ErrorMessage message={error} />
    </div>
  );
}
