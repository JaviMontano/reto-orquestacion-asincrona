# Plan — repositorio preparado para trabajo agéntico

Estado: aprobado por la solicitud que origina este cambio.

1. Añadir `AGENTS.md` como contrato breve y operativo.
2. Añadir paquetes de cambio en `docs/changes/` sin mover el código fuente.
3. Mejorar `README.md`: ruta de lectura, demo en vivo, arquitectura y método honesto.
4. Añadir scripts para crear y validar paquetes.
5. Integrar la validación documental en el gate existente.
6. Ejecutar comprobación documental, pruebas relevantes y gate Docker completo.
7. Registrar evidencia, revisar privacidad y publicar solo si todo está verde.

## Riesgos

- Duplicar instrucciones entre README y AGENTS: se evita separando audiencia humana y contrato del agente.
- Convertir el proceso en burocracia: solo cuatro archivos cortos por cambio material.
- Romper el gate estable: la nueva comprobación será POSIX `sh`, rápida y sin dependencias.
