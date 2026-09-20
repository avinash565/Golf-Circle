'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Signup page for creating a new Digital Heroes account.
export default function Signup() {
    // Store the list of available charities.
    const [charities, setCharities] = useState([]);

    // Store form input values.
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    // Store selected charity and contribution percentage.
    const [charity, setCharity] = useState('');
    const [percent, setPercent] = useState(10);

    // Monthly plan is selected by default.
    const [plan, setPlan] = useState('monthly');

    // Store success and error messages.
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    /* LOAD CHARITIES
       Fetch available charities when the page loads.*/

    useEffect(() => {
        const loadCharities = async () => {
            try {
                // Request active charities from the API.
                const response = await fetch('/api/charities');

                // Convert the API response into JSON.
                const result = await response.json();

                // Handle an unsuccessful API response.
                if (!response.ok) {
                    console.error('Charity API error:', result);

                    setCharities([]);

                    setError(
                        result.error || 'Failed to load charities'
                    );

                    return;
                }

                // Make sure the response is actually an array.
                setCharities(
                    Array.isArray(result) ? result : []
                );
            } catch (error) {
                // Handle network or unexpected errors.
                console.error(
                    'Failed to load charities:',
                    error
                );

                setCharities([]);

                setError('Failed to load charities');
            }
        };

        // Load charities once when the component mounts.
        loadCharities();
    }, []);


    /* 
       SIGNUP SUBMISSION
       Creates the Supabase account and subscription record.
       */

    const submit = async (e) => {
        // Prevent the browser from refreshing the page.
        e.preventDefault();

        // Clear previous error message.
        setError('');

        // Create the Supabase browser client.
        const s = createClient();

        // Create the user's Supabase Auth account.
        const { data, error } = await s.auth.signUp({
            email,
            password,

            // Store the user's name in Auth metadata.
            options: {
                data: {
                    full_name: name,
                },
            },
        });

        // Handle Supabase signup errors.
        if (error) {
            setError(error.message);
            return;
        }

        // Make sure Supabase returned a user.
        if (!data.user) {
            setError('Signup failed');
            return;
        }

        /* CREATE / UPDATE USER PROFILE */

        await s.from('profiles').upsert({
            id: data.user.id,
            full_name: name,
            role: 'subscriber',
        });


        /* CREATE INITIAL SUBSCRIPTION RECORD */

        await s.from('subscriptions').insert({
            user_id: data.user.id,
            plan,
            status: 'inactive',
            charity_id: charity,
            charity_percent: percent,
        });


        // Show a success message after account creation.
        setMsg(
            'Account created. Check your email if confirmation is enabled, then login.'
        );
    };


    /* SIGNUP FORM UI */

    return (
        <div className="container">

            {/* Signup form card */}
            <form
                className="form card"
                onSubmit={submit}
            >

                {/* Page heading */}
                <h1>
                    Become a Hero
                </h1>

                {/* Short description */}
                <p className="muted">
                    Create your account and choose a charity.
                </p>


                {/* Display error message when signup fails */}
                {error && (
                    <div className="error">
                        {error}
                    </div>
                )}


                {/* Display success message after signup */}
                {msg && (
                    <div className="success">
                        {msg}
                    </div>
                )}


                {/*  NAME FIELD */}

                <label>
                    Name

                    <input
                        value={name}
                        onChange={(e) =>
                            setName(e.target.value)
                        }
                        required
                    />
                </label>


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


                {/* PASSWORD FIELD */}

                <label>
                    Password

                    <input
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        type="password"
                        minLength={6}
                        required
                    />
                </label>


                {/* SUBSCRIPTION PLAN */}

                <label>
                    Plan

                    <select
                        value={plan}
                        onChange={(e) =>
                            setPlan(e.target.value)
                        }
                    >
                        <option value="monthly">
                            Monthly
                        </option>

                        <option value="yearly">
                            Yearly - discounted
                        </option>
                    </select>
                </label>


                {/* CHARITY SELECTION */}

                <label>
                    Charity

                    <select
                        value={charity}
                        onChange={(e) =>
                            setCharity(e.target.value)
                        }
                        required
                    >
                        <option value="">
                            Choose a charity
                        </option>

                        {/* Render charities only when the API
                returned an array. */}
                        {Array.isArray(charities) &&
                            charities.map((c) => (
                                <option
                                    key={c.id}
                                    value={c.id}
                                >
                                    {c.name}
                                </option>
                            ))}
                    </select>
                </label>


                {/* CHARITY CONTRIBUTION
            Minimum contribution is 10% */}

                <label>
                    Charity contribution: {percent}%

                    <input
                        type="range"
                        min="10"
                        max="50"
                        step="5"
                        value={percent}
                        onChange={(e) =>
                            setPercent(
                                Number(e.target.value)
                            )
                        }
                    />
                </label>


                {/* CREATE ACCOUNT BUTTON*/}

                <button
                    className="btn"
                    style={{ width: '100%' }}
                    type="submit"
                >
                    Create account
                </button>

            </form>
        </div>
    );
}
