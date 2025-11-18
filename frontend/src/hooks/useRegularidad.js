// src/hooks/useRegularidad.js
import { useState, useEffect } from 'react';

export const useRegularidad = (idEstudiante, idCurso = null) => {
  const [regularidad, setRegularidad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRegularidad = async () => {
      if (!idEstudiante) return;

      try {
        setLoading(true);
        setError(null);
        
        const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
        const token = localStorage.getItem("token") || "";

        const url = `${API}/api/regularidad/estudiante/${idEstudiante}${
          idCurso ? `?id_curso=${idCurso}` : ''
        }`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        
        if (json.ok) {
          setRegularidad(json.data);
        } else {
          throw new Error(json.error || 'Error al obtener regularidad');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRegularidad();
  }, [idEstudiante, idCurso]);

  return { regularidad, loading, error };
};

export const useEstudiantesProfesor = () => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEstudiantes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
        const token = localStorage.getItem("token") || "";

        const res = await fetch(`${API}/api/regularidad/profesor/estudiantes`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        
        if (json.ok) {
          setEstudiantes(json.data);
        } else {
          throw new Error(json.error || 'Error al obtener estudiantes');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEstudiantes();
  }, []);

  return { estudiantes, loading, error };
};