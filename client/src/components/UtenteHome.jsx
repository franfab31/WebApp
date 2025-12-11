import { Link } from 'react-router';
import { useEffect, useState } from 'react';
import API from '../API/API'; 
import { Container, Table, Badge, Row, Col, Card } from 'react-bootstrap';
import '../styles/UtenteHome.css';

export default function UtenteHome(props) {
  const [tasks, setTasks] = useState([]);
  const [studentStats, setStudentStats] = useState({});
  const [professorStats, setProfessorStats] = useState({});
  
  

  const utente = props.user; 


  useEffect(() => {
    
    const loadData = async () => {
      if (utente.ruolo === 'insegnante') {
        
        const [taskData, statsData] = await Promise.all([
            API.getTasksByProfessorId(utente.id),
            API.getProfessorStats(utente.id)
          ]);
          
        setTasks(taskData);
        setProfessorStats(statsData);
        
      } else if (utente.ruolo === 'studente') {
        
        const [taskData, statsData] = await Promise.all([
            API.getTasksByStudentId(utente.id),
            API.getStudentStats(utente.id),
          ]);
          
          setTasks(taskData);
          setStudentStats(statsData);

      }
    };
    loadData();
  }, [utente]);




  // Renderizza le statistiche per il professore
  const renderProfessorStats = () => (
    <Row className="mb-4 justify-content-center">
      <Col md={3}>
        <Card className="stats-card">
          <Card.Body className="text-center">
            <div className="stats-icon">📚</div>
            <h3 className="stats-number">{professorStats.totalTasks}</h3>
            <p className="stats-label">Task Assegnate</p>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="stats-card">
          <Card.Body className="text-center">
            <div className="stats-icon">✅</div>
            <h3 className="stats-number">{professorStats.completedTasks}</h3>
            <p className="stats-label">Completate</p>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="stats-card">
          <Card.Body className="text-center">
            <div className="stats-icon">⚠️</div>
            <h3 className="stats-number">{professorStats.toEvaluate}</h3>
            <p className="stats-label">Da Valutare</p>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  // Renderizza le statistiche per lo studente
  const renderStudentStats = () => (
    <div className="mb-4">
      <Row className="mb-4">
        <Col md={4}>
          <Card className="stats-card-student">
            <Card.Body className="text-center">
              <div className="stats-icon">📊</div>
              <h3 className="stats-number">{studentStats.totalTasks}</h3>
              <p className="stats-label">Task Totali</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="stats-card-student">
            <Card.Body className="text-center">
              <div className="stats-icon">🎯</div>
              <h3 className="stats-number">{studentStats.mediaGlobale}</h3>
              <p className="stats-label">Media Totale</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="stats-card-student">
            <Card.Body className="text-center">
              <div className="stats-icon">⏳</div>
              <h3 className="stats-number">{studentStats.totalAperte}</h3>
              <p className="stats-label">Task Aperte</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );

  
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.stato === b.stato) return 0;
    if (a.stato === 'aperto') return -1; //prima aperte
    return 1; // chiuse dopo
  });

  return (
    <Container fluid className="p-4">
      <h1 className="h2 fw-bold mb-4 text-center">
        {utente.ruolo === 'insegnante' 
          ? `Prof. ${utente.nome} ${utente.cognome}`
          : `Studente ${utente.nome} ${utente.cognome}`
        }
      </h1>

      
      {utente.ruolo === 'insegnante' ? renderProfessorStats() : renderStudentStats()}


      {/* Bottone crea task solo per professori */}
      {utente.ruolo === 'insegnante' && (
        <div className="new-task-section mb-5">
          <Link
            to="/professore/task/new"
            className="btn-primary-fluo"
            state={{professore: utente}}
          >
            <span className="emoji">➕</span>
            Crea nuovo compito
          </Link>
        </div>
      )}

      {/* Tabella task */}
      <div className="table-container">
        <h2 className="h4 fw-semibold text-secondary">
          {utente.ruolo === 'insegnante' ? 'I compiti assegnati' : 'I tuoi compiti'}
        </h2>
        
        <div className="table-responsive">
          <Table className="table-rounded text-center">
            <thead>
              <tr>
                <th>Domanda</th>
                <th>Stato</th>
                <th>Numero alunni</th>
                <th>Risposta</th>
                <th>Voto</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks.map(task => (
                <tr key={task.id}>
                  <td className="text-start">{task.domanda}</td>
                  
                  <td>
                    <Badge 
                      className={task.stato === 'aperto' ? 'badge-success-custom' : 'badge-danger-custom'}
                    >
                      {task.stato}
                    </Badge>
                  </td>
                  
                  <td>{task.dimensione_gruppo}</td>
                  
                  <td>
                    {!task.risposta ? (

                      <Badge className="badge-danger-custom">Nessuna risposta</Badge>

                    ) : task.voto !== null ? ( 

                      <Badge className="badge-success-custom">Risposta valutata</Badge>

                    ) : (

                      <Badge className="badge-warning-custom">Da valutare</Badge>
                      
                    )}
                  </td>
                  
                  <td>
                    {task.voto !== null ? (
                      <Badge className="badge-success-custom">{task.voto}/30</Badge>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  
                  <td>
                    <div className="action-buttons">
                      
                      {utente.ruolo === 'insegnante' ? (
                        // Bottoni per professore
                        !task.risposta ? (
                          <Link
                            to={`/professore/task/${task.id}/domanda`}
                            state={{task, utente}}
                            className="btn-info-fluo"
                          >
                            👁️ Visualizza task
                          </Link>
                        ) : task.voto !== null ? ( 
                          <Link
                            to={`/professore/task/${task.id}/domanda`}
                            state={{task, utente}}
                            className="btn-success-fluo"
                          >
                            ✅ Visualizza risposta
                          </Link>
                        ) : (
                          <Link
                            to={`/professore/task/${task.id}/domanda`}
                            state={{task, utente}}
                            className="btn-warning-fluo"
                          >
                            ⚠️ Valuta risposta
                          </Link>
                        )
                      ) : (
                        // Bottoni per studente (rimangono uguali)
                        task.stato === 'chiuso' ? (
                          <Link
                            to={`/studente/task/${task.id}/domanda`}
                            state={{task, utente}}
                            className="btn-success-fluo"
                          >
                            👀 Visualizza
                          </Link>
                        ) : (
                          <Link
                            to={`/studente/task/${task.id}/domanda`}
                            state={{task, utente}}
                            className="btn-warning-fluo"
                          >
                            ✏️ Rispondi
                          </Link>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      
    </Container>
  );
}