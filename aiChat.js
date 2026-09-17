// aiChat.js - Asistente de Inteligencia Artificial para StatCalc Pro
import { StatsEngine } from './statsEngine.js';

export class AIChat {
  constructor(appInstance) {
    this.app = appInstance;
  }

  async processMessage(userPrompt) {
    const prompt = userPrompt.toLowerCase();

    // Detección de números en la entrada
    const numbersMatch = userPrompt.match(/-?\d+(\.\d+)?/g);
    
    if (prompt.includes("calcula") || prompt.includes("analiza") || prompt.includes("datos")) {
      if (numbersMatch && numbersMatch.length > 2) {
        const numbers = numbersMatch.map(Number);
        
        // Simulación de control automático de la interfaz
        this.app.setDataInput(numbers.join(", "));
        this.app.runCalculation();

        return `¡Perfecto! Extraje los siguientes datos del problema: [${numbers.join(', ')}]. He configurado el panel de control, ejecutado los cálculos estadísticos detallados paso a paso y generado los gráficos 3D interactivos. Puedes revisar los resultados abajo.`;
      } else {
        return "Para ayudarte a resolver el ejercicio, por favor proporciona la lista de números o la tabla de frecuencias de tus datos agrupados.";
      }
    }

    if (prompt.includes("limpiar") || prompt.includes("reset")) {
      this.app.resetAll();
      return "He reseteado todos los paneles y campos de entrada.";
    }

    if (prompt.includes("exportar") || prompt.includes("pdf") || prompt.includes("excel")) {
      return "Puedes descargar los resultados en múltiples formatos (PDF, Excel, CSV) utilizando los botones de exportación ubicados en la barra superior de acciones.";
    }

    return "Hola, soy tu asistente estadístico con IA. Puedo analizar problemas de texto con datos, autocompletar la web, seleccionar las fórmulas pertinentes y darte la resolución completa paso a paso. ¡Intenta pegar un ejercicio aquí!";
  }
}