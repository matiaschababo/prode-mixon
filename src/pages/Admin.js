// src/pages/Admin.js

export function Admin() {
  return `
    <div class="admin-page animate-fade-in" style="max-width: 600px; margin: 0 auto;">
      <h1 style="margin-bottom: 2rem; text-align: center;">Panel de Administración</h1>
      
      <div class="glass-card" id="login-section">
        <h3 style="margin-bottom: 1rem;">Acceso Restringido</h3>
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Ingresá la contraseña para cargar resultados y predicciones.</p>
        
        <div style="display: flex; gap: 1rem;">
          <input type="password" id="admin-pass" placeholder="Contraseña" style="flex: 1; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--glass-border); background: rgba(0,0,0,0.2); color: white;">
          <button class="btn btn-primary" id="btn-login">Ingresar</button>
        </div>
      </div>

      <div id="admin-dashboard" style="display: none; margin-top: 2rem;">
        <div class="grid-2">
          <div class="glass-card" style="text-align: center; border-color: var(--color-mixon-main);">
            <h3>Cargar Predicciones</h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0.5rem 0 1rem;">Ingresar los resultados que dijo cada conductor.</p>
            <button class="btn btn-secondary">Cargar</button>
          </div>
          
          <div class="glass-card" style="text-align: center; border-color: var(--color-exact);">
            <h3>Forzar Update API</h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0.5rem 0 1rem;">Actualizar resultados reales desde API-Football.</p>
            <button class="btn btn-secondary" style="color: var(--color-exact);">Actualizar</button>
          </div>
        </div>
      </div>
    </div>
  `;
}
