'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Login page for existing Digital Heroes users.
export default function Login() {
    // Store the user's email and password.
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Store any authentication error message.
    const [error, setError] = useState('');


    /* LOGIN HANDLER
       Authenticates the user using Supabase. */

    const submit = async (e) => {
        // Prevent the default form submission and page reload.
        e.preventDefault();

        // Clear any previous error message.
        setError('');

        // Create the Supabase browser client.
        const s = createClient();

        // Sign in the user using email and password.
        const { error } =
            await s.auth.signInWithPassword({
                email,
                password,
            });

        // Show the authentication error if login fails.
        if (error) {
            setError(error.message);
        } else {
            // Redirect the successfully logged-in user
            // to the dashboard.
            location.href = '/dashboard';
        }
    };


    /* LOGIN FORM UI */

    return (
        <div className="container">

            {/* Login form card */}
            <form
                className="form card"
                onSubmit={submit}
            >

                {/* Page heading */}
                <h1>
                    Welcome back
                </h1>

                {/* Short login description */}
                <p className="muted">
                    Sign in to your Digital Heroes account.
                </p>


                {/* Display authentication error */}
                {error && (
                    <div className="error">
                        {error}
                    </div>
                )}


                {/* EMAIL FIELD */}

                <label>
                    Email

                    <input
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        type="email"
                        required
                    />
                </label>


                {/*  PASSWORD FIELD */}

                <label>
                    Password

                    <input
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        type="password"
                        required
                    />
                </label>


                {/*LOGIN BUTTON*/}

                <button
                    className="btn"
                    style={{ width: '100%' }}
                    type="submit"
                >
                    Login
                </button>
                {/* SIGNUP LINK */}
                <p
                    className="muted"
                    style={{
                        textAlign: 'center',
                        marginTop: 16,
                    }}
                >
                    Don't have an account?{' '}
                    <a href="/signup">Signup</a>
                </p>

            </form>
        </div>
    );
}
