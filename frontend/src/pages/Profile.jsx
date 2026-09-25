import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import { updateStoredUser } from "../services/authService";
import { changePassword, getProfile, updateProfile } from "../services/profileService";
import { formatDate } from "../utils/format";

import "./buyer/awardFlow.css";
import "./Profile.css";


const EMPTY_PASSWORDS = { current: "", next: "", confirm: "" };


function toForm(profile) {
    return {
        full_name: profile.full_name ?? "",
        company_name: profile.company_name ?? "",
        company_email: profile.company_email ?? "",
        phone: profile.phone ?? "",
        address: profile.address ?? ""
    };
}


function initials(name) {
    return name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}


function Field({ id, label, hint, error, children }) {
    return (
        <div className="nallabid-profile-field">
            <label htmlFor={id}>{label}</label>
            {children}
            {error ? <small className="nallabid-profile-error">{error}</small> : hint && <small>{hint}</small>}
        </div>
    );
}


function Profile() {
    const navigate = useNavigate();
    const location = useLocation();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [form, setForm] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);

    const [passwords, setPasswords] = useState(EMPTY_PASSWORDS);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState(null);

    // setState only runs in promise callbacks, never synchronously inside the effect.
    const loadProfile = useCallback(() => getProfile()
        .then((result) => {
            setProfile(result);
            setForm(toForm(result));
            setError(null);
        })
        .catch(setError)
        .finally(() => setLoading(false)), []);

    function retryProfile() {
        setLoading(true);
        setError(null);
        loadProfile();
    }

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((current) => ({ ...current, [name]: value }));
        setFieldErrors((current) => ({ ...current, [name]: undefined }));
        setSaveMessage(null);
    }

    function validate() {
        const errors = {};

        if (form.full_name.trim().length < 2) {
            errors.full_name = "Enter your full name (at least 2 characters).";
        }

        if (form.company_name.trim().length < 2) {
            errors.company_name = "Enter the company name (at least 2 characters).";
        }

        if (form.company_email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.company_email.trim())) {
            errors.company_email = "Enter a valid email address.";
        }

        if (form.phone.trim() && !/^[0-9+()\-\s]{7,30}$/.test(form.phone.trim())) {
            errors.phone = "Use 7-30 digits; + ( ) - and spaces are allowed.";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function handleSave(event) {
        event.preventDefault();

        if (!validate()) {
            return;
        }

        setSaving(true);
        setSaveMessage(null);

        try {
            const saved = await updateProfile(form);

            setProfile(saved);
            setForm(toForm(saved));
            setSaveMessage({ type: "success", text: "Profile saved." });

            // Refresh the cached name, then re-navigate in place so the Navbar re-renders it.
            updateStoredUser({ full_name: saved.full_name });
            navigate(location.pathname, { replace: true });
        } catch (requestError) {
            setSaveMessage({ type: "error", text: requestError.message });
        } finally {
            setSaving(false);
        }
    }

    function handlePasswordChange(event) {
        const { name, value } = event.target;

        setPasswords((current) => ({ ...current, [name]: value }));
        setPasswordMessage(null);
    }

    async function handlePasswordSubmit(event) {
        event.preventDefault();

        if (passwords.next.length < 8) {
            setPasswordMessage({ type: "error", text: "New password must be at least 8 characters." });
            return;
        }

        if (passwords.next !== passwords.confirm) {
            setPasswordMessage({ type: "error", text: "New passwords do not match." });
            return;
        }

        setPasswordSaving(true);

        try {
            await changePassword(passwords.current, passwords.next);
            setPasswords(EMPTY_PASSWORDS);
            setPasswordMessage({ type: "success", text: "Password updated. Use it next time you log in." });
        } catch (requestError) {
            setPasswordMessage({ type: "error", text: requestError.message });
        } finally {
            setPasswordSaving(false);
        }
    }

    if (loading && !profile) {
        return (
            <div className="nallabid-flow-page">
                <Loading message="Loading your profile..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="nallabid-flow-page">
                <ErrorMessage error={error} onRetry={retryProfile} />
            </div>
        );
    }

    const isSupplier = profile.role === "SUPPLIER";
    const hasChanges = JSON.stringify(form) !== JSON.stringify(toForm(profile));

    return (
        <div className="nallabid-flow-page nallabid-profile-page">

            <header className="nallabid-profile-hero">
                <div className="nallabid-profile-avatar" aria-hidden="true">
                    {initials(profile.full_name)}
                </div>

                <div className="nallabid-profile-hero-text">
                    <h1>{profile.full_name}</h1>
                    <p>{profile.email}</p>
                    <div className="nallabid-profile-tags">
                        <span className="nallabid-flow-badge nallabid-flow-badge-open">
                            <i className={`bi ${isSupplier ? "bi-truck" : "bi-briefcase"}`}></i>
                            {isSupplier ? "Supplier" : "Buyer"}
                        </span>
                        <span className="nallabid-profile-since">Member since {formatDate(profile.member_since)}</span>
                    </div>
                </div>
            </header>

            {!profile.profile_completed && (
                <div className="nallabid-flow-alert nallabid-flow-alert-info">
                    <i className="bi bi-info-circle"></i>
                    <span>
                        Your {isSupplier ? "supplier" : "company"} profile is not set up yet. Add your company details below
                        {isSupplier ? " — you need a supplier profile to submit quotations." : "."}
                    </span>
                </div>
            )}

            <div className="nallabid-profile-grid">

                <form className="nallabid-flow-panel" onSubmit={handleSave} noValidate>
                    <div className="nallabid-flow-panel-head">
                        <div>
                            <h2>{isSupplier ? "Supplier details" : "Account & company"}</h2>
                            <p>
                                {isSupplier
                                    ? "Buyers see these details on your supplier profile."
                                    : "Your name and the company you procure for."}
                            </p>
                        </div>
                    </div>

                    <div className="nallabid-flow-panel-body nallabid-profile-fields">
                        <Field id="full_name" label="Full name" error={fieldErrors.full_name}>
                            <input id="full_name" name="full_name" value={form.full_name} onChange={handleChange} maxLength={100} autoComplete="name" />
                        </Field>

                        <Field id="login_email" label="Login email" hint="Used to sign in; it cannot be changed here.">
                            <input id="login_email" value={profile.email} disabled />
                        </Field>

                        <Field id="company_name" label="Company name" error={fieldErrors.company_name}>
                            <input id="company_name" name="company_name" value={form.company_name} onChange={handleChange} maxLength={150} autoComplete="organization" />
                        </Field>

                        <Field id="company_email" label="Business email" hint="Optional" error={fieldErrors.company_email}>
                            <input id="company_email" name="company_email" type="email" value={form.company_email} onChange={handleChange} maxLength={150} autoComplete="email" />
                        </Field>

                        <Field id="phone" label="Phone" hint="Optional" error={fieldErrors.phone}>
                            <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} maxLength={30} autoComplete="tel" />
                        </Field>

                        <Field id="address" label="Address" hint="Optional">
                            <textarea id="address" name="address" rows={3} value={form.address} onChange={handleChange} maxLength={500} autoComplete="street-address" />
                        </Field>

                        {saveMessage && (
                            <div
                                className={`nallabid-flow-alert nallabid-flow-alert-${saveMessage.type} nallabid-profile-wide`}
                                role={saveMessage.type === "error" ? "alert" : "status"}
                            >
                                <i className={`bi ${saveMessage.type === "error" ? "bi-exclamation-circle" : "bi-check-circle"}`}></i>
                                <span>{saveMessage.text}</span>
                            </div>
                        )}

                        <div className="nallabid-profile-actions nallabid-profile-wide">
                            <button
                                type="button"
                                className="nallabid-flow-button nallabid-flow-button-ghost"
                                disabled={!hasChanges || saving}
                                onClick={() => {
                                    setForm(toForm(profile));
                                    setFieldErrors({});
                                    setSaveMessage(null);
                                }}
                            >
                                Discard changes
                            </button>

                            <button
                                type="submit"
                                className="nallabid-flow-button nallabid-flow-button-primary"
                                disabled={!hasChanges || saving}
                            >
                                <i className={saving ? "bi bi-hourglass-split" : "bi bi-check2"}></i>
                                {saving ? "Saving..." : "Save profile"}
                            </button>
                        </div>
                    </div>
                </form>

                <form className="nallabid-flow-panel nallabid-profile-password" onSubmit={handlePasswordSubmit} noValidate>
                    <div className="nallabid-flow-panel-head">
                        <div>
                            <h2>Change password</h2>
                            <p>At least 8 characters.</p>
                        </div>
                    </div>

                    <div className="nallabid-flow-panel-body nallabid-profile-stack">
                        <Field id="current" label="Current password">
                            <input id="current" name="current" type="password" value={passwords.current} onChange={handlePasswordChange} autoComplete="current-password" required />
                        </Field>

                        <Field id="next" label="New password">
                            <input id="next" name="next" type="password" value={passwords.next} onChange={handlePasswordChange} autoComplete="new-password" minLength={8} maxLength={128} required />
                        </Field>

                        <Field id="confirm" label="Confirm new password">
                            <input id="confirm" name="confirm" type="password" value={passwords.confirm} onChange={handlePasswordChange} autoComplete="new-password" required />
                        </Field>

                        {passwordMessage && (
                            <div
                                className={`nallabid-flow-alert nallabid-flow-alert-${passwordMessage.type}`}
                                role={passwordMessage.type === "error" ? "alert" : "status"}
                            >
                                <i className={`bi ${passwordMessage.type === "error" ? "bi-exclamation-circle" : "bi-check-circle"}`}></i>
                                <span>{passwordMessage.text}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="nallabid-flow-button nallabid-flow-button-primary"
                            disabled={passwordSaving || !passwords.current || !passwords.next || !passwords.confirm}
                        >
                            <i className={passwordSaving ? "bi bi-hourglass-split" : "bi bi-shield-lock"}></i>
                            {passwordSaving ? "Updating..." : "Update password"}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}


export default Profile;
