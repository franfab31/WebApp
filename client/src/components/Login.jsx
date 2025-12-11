import { useActionState } from "react";
import { Form, Button, Row, Col, Alert, Card } from 'react-bootstrap';
import { Link } from 'react-router';
import '../styles/Login.css';

function LoginForm(props) {
    const [state, formAction, isPending] = useActionState(loginFunction, {username: '', password: ''});

    async function loginFunction(prevState, formData) {
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password'),
        };
        try {
            const user = await props.handleLogin(credentials);
            return { success: true };
        } catch (error) {
            return { 
                error: 'Username e/o password errati'
            };
        }
    }

    return (
        <div id="login-page">
            
            <div className="gradient-bg"></div>
            
            <div className="login-container">
                <div className="login-content">
                    
                    <div className="login-header">
                        <h1 className="login-title">Accedi al Sistema</h1>
                        <p className="login-subtitle">Inserisci le tue credenziali per continuare</p>
                    </div>

                    {/* Loading Alert */}
                    {isPending && (
                        <Alert variant="warning" className="glass-alert">
                            <div className="d-flex align-items-center">
                                <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                Attendere la risposta del server...
                            </div>
                        </Alert>
                    )}

                    
                    <Card className="login-card glass-card">
                        <Card.Body className="p-4">
                            <Form action={formAction}>
                                <Form.Group controlId='username' className='mb-4'>
                                    <Form.Label className="form-label-custom">
                                        <span className="label-icon">👤</span>
                                        Username
                                    </Form.Label>
                                    <Form.Control 
                                        type='text' 
                                        name='username' 
                                        required 
                                        className="form-input-custom"
                                        placeholder="Inserisci il tuo username"
                                        disabled={isPending}
                                    />
                                </Form.Group>

                                <Form.Group controlId='password' className='mb-4'>
                                    <Form.Label className="form-label-custom">
                                        <span className="label-icon">🔒</span>
                                        Password
                                    </Form.Label>
                                    <Form.Control 
                                        type='password' 
                                        name='password' 
                                        required 
                                        minLength={6}
                                        className="form-input-custom"
                                        placeholder="Inserisci la tua password"
                                        disabled={isPending}
                                    />
                                </Form.Group>

                                {/* Alerts */}
                                {state.error && (
                                    <Alert variant="danger" className="glass-alert mb-4">
                                        <strong>❌ Errore:</strong> {state.error}
                                    </Alert>
                                )}
                                
                                {state.success && (
                                    <Alert variant="success" className="glass-alert mb-4">
                                        <strong>✅ Successo:</strong> Login effettuato con successo!
                                    </Alert>
                                )}

                                {/* Buttons */}
                                <div className="login-buttons">
                                    <Button 
                                        type='submit' 
                                        disabled={isPending}
                                        className="btn-login-primary"
                                    >
                                            <>
                                                Accedi
                                            </>
                                    </Button>
                                    <Link 
                                        className='btn-login-secondary' 
                                        to={'/'} 
                                        style={{pointerEvents: isPending ? 'none' : 'auto'}}
                                    >
                                        <span className="btn-text">Torna alla Home</span>
                                    </Link>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>

                </div>
            </div>
        </div>
    );
}

function LogoutButton(props) {
    return <Button variant='outline-light' onClick={props.logout}>Logout</Button>;
}

export { LoginForm, LogoutButton };