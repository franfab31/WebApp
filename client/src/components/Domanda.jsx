import { useActionState, useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import '../styles/Risposta.css';
import API from '../API/API';


export default function Domanda(props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

 
  const utente = props.user || location.state?.utente;
  const [task, setTask] = useState(location.state?.task);
  const [caricamento, setCaricamento] = useState(true);


  if (!task || !utente) {
      return (
        <Container className="my-4">
          <Row className="justify-content-center">
            <Col lg={8}>
              <Alert variant="danger">
                <p className="lead">Task o utente non valido o inesistente</p>
              </Alert>
            </Col>
          </Row>
        </Container>
      );
    }
  

 const infotask = async () => {
    try {
      setCaricamento(true);
      const tsk = await API.getTaskInfo(task);
      
      setTask(tsk);
    } catch (err) {
      return(err);
    } finally {
      setCaricamento(false);
    }
  };

  useEffect(() => {
    infotask();
  }, [id]);

  if (caricamento) {
    return (
      <Container className="my-4">
        <Row className="justify-content-center">
          <Col lg={8}>
            <Card className="shadow-lg">
              <Card.Body className="p-4 text-center">
                <Spinner animation="border" variant="primary" className="mb-3" />
                <h5>Caricamento informazioni task...</h5>
                <p className="text-muted">Attendere prego</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  
  if (!task) {
    return (
      <Container className="my-4">
        <Row className="justify-content-center">
          <Col lg={8}>
            <Alert variant="warning">
              <Alert.Heading>Task non trovato</Alert.Heading>
              <p>Il task richiesto non è stato trovato o non hai i permessi per visualizzarlo.</p>
              <hr />
              <Link 
                to={utente.ruolo === 'insegnante' ? '/professore' : '/studente'} 
                className="btn btn-outline-warning"
              >
                Esci
              </Link>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <TaskForm
      task={task}
      utente={utente}
      navigate={navigate}
    />
  );
}

function TaskForm({ task, utente, navigate }) {
  
  const isProfessore = utente.ruolo === 'insegnante';
  const isStudente = utente.ruolo === 'studente';

  const initialState = {
    risposta: task.risposta || '',
    voto: task.voto ?? '',
    error: '',
  };

  const handleSubmit = async (prevState, formData) => {
    const data = Object.fromEntries(formData.entries());
    
    try {
      if (isStudente) {
        if (!data.risposta || data.risposta.trim() === '') {
          data.error = "La risposta non può essere vuota";
          return data;
        }
        const taskfind = await API.getTaskById(task.id);
        
        if (taskfind.stato !== 'aperto') {
          data.error = "Non puoi modificare la risposta di un compito chiuso";
          return data;
        }

        
        
        await API.setRispostaTask(task.id, data.risposta.trim());
        navigate('/studente');

      } else if (isProfessore) {
        const voto = parseInt(data.voto);
        if (isNaN(voto) || voto < 0 || voto > 30) {
          data.error = "Il voto deve essere un numero tra 0 e 30";
          return data;
        }
        if (!task.risposta) {
          data.error = "Non puoi valutare un compito senza risposta";
          return data;
        }

        const taskfind = await API.getTaskById(task.id);

        if(taskfind.risposta.trim() !==task.risposta.trim()) {
          data.error="la risposta è stata modificata mentre inserivi il voto";
          return data;
        }

        if (task.stato !== 'aperto') {
          data.error = "Non puoi valutare un compito già chiuso";
          return data;
        }
        
        await API.setVotoTask(task.id, voto);
        navigate('/professore');
      }
      
    } catch (err) {
      return data;
    }
  };

  const [state, formAction, isPending] = useActionState(handleSubmit, initialState);

  return (
    <Container className="my-4">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="shadow-lg">
            <Card.Body className="p-4">
              <Card.Title className="text-center mb-4 pb-3 border-bottom">
                <h1>
                  {isProfessore ? 'Compito' : 'Il vostro Compito'}
                </h1>
              </Card.Title>

              {/*domanda */}
              <Card className="mb-4 bg-light">
                <Card.Body>
                  <Card.Title className="h5 text-secondary">
                    <i className="bi bi-question-lg me-2"></i>
                    Domanda:
                  </Card.Title>
                  <Card className="bg-white mt-2">
                    <Card.Body>
                      <p className="mb-0">{task.domanda}</p>
                    </Card.Body>
                  </Card>
                </Card.Body>
              </Card>

              {/*Squadra */}
              <Card className="mb-4" style={{backgroundColor: '#e3f2fd'}}>
                <Card.Body>
                  <Card.Title className="h5 text-secondary d-flex align-items-center">
                    <i className="bi bi-people-fill me-2 text-primary"></i>
                    Squadra di Lavoro
                  </Card.Title>
                  <Card className="bg-white mt-2">
                    <Card.Body>
                      {task.studenti && task.studenti.length > 0 ? (
                        <div>
                          <strong>Membri del gruppo ({task.studenti.length}):</strong>
                          <div className="mt-2">
                            {task.studenti.map((studente, idx) => (
                              <span key={studente.id || idx}>
                                {studente.nome} {studente.cognome}
                                {idx < task.studenti.length - 1 && ', '}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted fst-italic">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          Nessun studente assegnato al task
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Card.Body>
              </Card>


              {/* form risposta e voto  */}

              { state.error && <Alert variant="secondary">{state.error}</Alert> }

              <Form action={formAction}>

                {/* Risposta */}
                <Card className="mb-4 bg-light">
                  <Card.Body>
                    <Card.Title className="h5 text-secondary">
                      <i className="bi bi-pencil me-2"></i>
                      {isProfessore ? 'Risposta del gruppo:' : 'La vostra risposta:'}
                    </Card.Title>
                    <Card className="bg-white mt-2">
                      <Card.Body style={{minHeight: '120px'}}>
                       
                        {isStudente && task.stato === 'aperto' ? (
                          <Form.Control
                            as="textarea"
                            name="risposta"
                            rows={6}
                            defaultValue={state.risposta}
                            placeholder="Scrivi la tua risposta qui..."
                            className="border-0"
                            required={true}           
                            minLength={1}            
                            style={{resize: 'none', outline: 'none'}}
                            disabled={isPending}
                          />
                        ) : task.risposta ? (
                          <div className="text-dark" style={{whiteSpace: 'pre-wrap', lineHeight: '1.6'}}>
                            {task.risposta}
                          </div>
                        ) : (
                          <div className="d-flex align-items-center justify-content-center h-100">
                            <span className="text-muted fst-italic text-center">
                              {isProfessore ? 'Nessuna risposta ancora disponibile' : 'Non hai ancora risposto'}
                            </span>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Card.Body>
                </Card>

                {/* Form azioni */}
                <Card className="bg-light">
                  <Card.Body>
                    <Row className="align-items-center">
                      <Col md={8}>                      

                        {/* Bottone per studente */}
                        {isStudente && task.stato === 'aperto' && (
                          <div className="d-flex gap-2">
                            <Button 
                              type="submit" 
                              variant="success"
                              disabled={isPending}
                              className="px-4 py-2"
                            >
                              {isPending ? (
                                <>
                                  <Spinner size="sm" className="me-2" />
                                  Salvando...
                                </>
                              ) : (
                                'Salva Risposta'
                              )}
                            </Button>
                          </div>
                        )}

                        {/* Form per professore */}
                        {isProfessore && task.stato === 'aperto' && task.risposta && (
                          <Card className="border-success">
                            <Card.Body>
                              <div className="d-flex align-items-center gap-3">
                                <Form.Label className="mb-0 text-success fw-medium">
                                  Voto:
                                </Form.Label>
                                <Form.Control
                                  type="number"
                                  name="voto"
                                  min="0"
                                  max="30"
                                  defaultValue={state.voto}
                                  className="border-success"
                                  style={{width: '80px'}}
                                  required={true}  
                                  disabled={isPending}
                                />
                                <Button 
                                  type="submit" 
                                  variant="success"
                                  disabled={isPending}
                                >
                                  {isPending ? (
                                    <>
                                      <Spinner size="sm" className="me-2" />
                                      Assegnando...
                                    </>
                                  ) : (
                                    'Assegna Voto'
                                  )}
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>
                        )}

                        {/* Task chiuso */}
                        {task.stato === 'chiuso' && (
                          <div className="text-success fw-bold">
                            {isProfessore 
                              ? `Voto assegnato: ${task.voto}/30` 
                              : `Il voto del gruppo: ${task.voto}/30`
                            }
                          </div>
                        )}

                        
                      </Col>

                      <Col md={4} className="text-end">
                        <Link 
                          className="btn btn-danger px-4 py-2" 
                          to={isProfessore ? '/professore' : '/studente'}
                        >
                          Annulla
                        </Link>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Form>

            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}