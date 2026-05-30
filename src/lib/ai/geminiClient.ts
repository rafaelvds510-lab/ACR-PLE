import { GoogleGenerativeAI, ChatSession } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || '';

export class GeminiAgent {
  private genAI: GoogleGenerativeAI;
  private chatSession: ChatSession | null = null;
  private systemInstruction: string;
  private modelName: string;

  constructor(systemInstruction: string, modelName: string = 'gemini-1.5-flash') {
    this.genAI = new GoogleGenerativeAI(API_KEY);
    this.systemInstruction = systemInstruction;
    this.modelName = modelName;
  }

  // Inicializa a sessão com gerenciamento de histórico
  public initChat(history: { role: 'user' | 'model'; parts: { text: string }[] }[] = []) {
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction: this.systemInstruction,
    });
    
    this.chatSession = model.startChat({
      history: history,
      generationConfig: {
        temperature: 0.2, // Baixa temperatura para geração mais determinística/estruturada
        maxOutputTokens: 8192,
      }
    });
  }

  // Wrapper para tratamento de erros (cota excedida) e streaming
  public async *sendMessageStream(message: string | any[]) {
    if (!this.chatSession) {
      this.initChat();
    }

    try {
      if (!API_KEY) {
        throw new Error('GEMINI_API_KEY não configurada no ambiente.');
      }
      
      const result = await this.chatSession!.sendMessageStream(message);
      
      for await (const chunk of result.stream) {
        yield chunk.text();
      }
    } catch (error: any) {
      console.error('Erro na API do Gemini:', error);
      
      // Tratamento específico de erros, como cota excedida
      if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('Too Many Requests')) {
        throw new Error('A cota da API do Gemini foi excedida. Por favor, tente novamente mais tarde.');
      }
      
      throw new Error(error?.message || 'Falha ao comunicar com o agente IA.');
    }
  }

  // Método auxiliar para obter a resposta completa não-streamed
  public async sendMessage(message: string | any[]): Promise<string> {
    let fullResponse = '';
    for await (const chunk of this.sendMessageStream(message)) {
      fullResponse += chunk;
    }
    return fullResponse;
  }
}
