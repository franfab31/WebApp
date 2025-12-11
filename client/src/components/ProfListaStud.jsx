import { useEffect, useState } from 'react';
import API from '../API/API'; 
import { Row, Col, Table } from 'react-bootstrap';
import '../styles/ProfListaStud.css';

export default function ProfListaStud(props) {
  const [studenti, setStudenti] = useState([]);

  const ListaStud = async () => {
      try {
        const data = await API.getStudentStatsByprof(props.user.id); 
        setStudenti(data);
      }
      catch (err) {
        return(err);
      }
  }

  useEffect(() => {
    ListaStud();
  }, [props.user.id]);

  return (
    <div className="students-list-container">
      <div className="students-page-header">
        <h1>Lista Studenti - Prof. {props.user.nome} {props.user.cognome}</h1>
      </div>
      <StudentiTable studenti={studenti} />
    </div>
  );

  function StudentiTable(props) {
    const [orderby, setOrderby] = useState('alfabetico'); 
    const [orderdir, setOrderdir] = useState('asc');
    const [isExpanded, setIsExpanded] = useState(false); 
    
    const sortedStudenti = [...props.studenti];

    if (orderby === "alfabetico") {
      sortedStudenti.sort((a, b) => {
        if(orderdir === 'asc') {
          if (a.cognome < b.cognome) return -1;
          if (a.cognome > b.cognome) return 1;
          if (a.nome < b.nome) return -1;
          if (a.nome > b.nome) return 1;
          return a.id - b.id;
        }else if (orderdir === 'desc') {
          if (a.cognome > b.cognome) return -1;
          if (a.cognome < b.cognome) return 1;
          if (a.nome > b.nome) return -1;
          if (a.nome < b.nome) return 1;
          return a.id - b.id;
        }
    });
  } else if (orderby === "totale") {
    sortedStudenti.sort((a, b) => {
      const totaleA = a.taskaperte + a.taskchiuse;
      const totaleB = b.taskaperte + b.taskchiuse;
      if(orderdir === 'asc') {
        if (totaleA < totaleB) return -1;
        if (totaleA > totaleB) return 1;
        return a.id - b.id;
      } else if (orderdir === 'desc') {
        if (totaleA > totaleB) return -1;
        if (totaleA < totaleB) return 1;
        return a.id - b.id;
      }
    });
  } else if (orderby === "media") {
    sortedStudenti.sort((a, b) => {
      const mediaA = a.media || 0;
      const mediaB = b.media || 0;
      if(orderdir === 'asc') {
        if (mediaA < mediaB) return -1;
        if (mediaA > mediaB) return 1;
        return a.id - b.id;
      }
      else if (orderdir === 'desc') {
        if (mediaA > mediaB) return -1;
        if (mediaA < mediaB) return 1;
        return a.id - b.id;
      }
    });
  }

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <div className={`sort-controls-container ${isExpanded ? 'expanded' : ''}`}>
        <div className={`sort-controls-header ${isExpanded ? 'expanded' : ''}`} onClick={handleToggle}>
          <h2 className={`sort-controls-title ${isExpanded ? 'expanded' : ''}`}>
            Opzioni di Ordinamento
          </h2>
          <span className={`toggle-arrow ${isExpanded ? 'expanded' : ''}`}>
            ▼
          </span>
        </div>
        
        <div className={`sort-controls-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
          <Row className="g-4">
            <Col md={6}>
              <div className="card sort-card">
                <div className="card-body">
                  <h6 className="card-title">Ordina per:</h6>
                  <div className="custom-radio-group">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="orderby"
                        id="orderby-alfabetico"
                        value="alfabetico"
                        checked={orderby === 'alfabetico'}
                        onChange={(e) => setOrderby(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="orderby-alfabetico">
                        Nome e Cognome
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="orderby"
                        id="orderby-totale"
                        value="totale"
                        checked={orderby === 'totale'}
                        onChange={(e) => setOrderby(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="orderby-totale">
                        Compiti Totali
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="orderby"
                        id="orderby-media"
                        value="media"
                        checked={orderby === 'media'}
                        onChange={(e) => setOrderby(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="orderby-media">
                        Media Voti
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </Col>

            <Col md={6}>
              <div className="card sort-card">
                <div className="card-body">
                  <h6 className="card-title">Direzione:</h6>
                  <div className="custom-radio-group">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="orderdir"
                        id="orderdir-asc"
                        value="asc"
                        checked={orderdir === 'asc'}
                        onChange={(e) => setOrderdir(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="orderdir-asc">
                        <span className="radio-label-with-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-up" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5"/>
                          </svg>
                          <span>Crescente</span>
                        </span>
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="orderdir"
                        id="orderdir-desc"
                        value="desc"
                        checked={orderdir === 'desc'}
                        onChange={(e) => setOrderdir(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="orderdir-desc">
                        <span className="radio-label-with-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-down" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1"/>
                          </svg>
                          <span>Decrescente</span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      <div className="students-table-container">
        <h2 className="students-table-title">Elenco Studenti e Statistiche</h2>
        
        <div className="table-responsive">
          <Table className="students-table-rounded text-center">
            <thead>
              <tr>
                <th>Cognome</th>
                <th>Nome</th>
                <th>Compiti aperti</th>
                <th>Compiti chiusi</th>
                <th>Compiti totali</th>
                <th>Media voti</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudenti.map(stud => (
                <tr key={stud.id}>
                  <td className="fw-semibold">{stud.cognome}</td>
                  <td>{stud.nome}</td>
                  <td>{stud.taskaperte}</td>
                  <td>{stud.taskchiuse}</td>
                  <td className="fw-semibold">{stud.taskaperte + stud.taskchiuse}</td>
                  <td>
                    {stud.taskchiuse === 0 ? '—' : (stud.media ?? '—')}
                  </td>            
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    </>
  );
  }
}

