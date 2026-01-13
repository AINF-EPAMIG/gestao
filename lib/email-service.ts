import nodemailer from 'nodemailer';
import type { SendMailOptions } from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 587,
  secure: false,
  auth: {
    user: 'webmaster@epamigsistema.com.br',
    pass: '*Desenvolvimento23'
  }
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const mailOptions: SendMailOptions = {
      from: '"Kanban" <webmaster@epamigsistema.com.br>',
      to,
      subject,
      html
    };
    if (to !== 'arthur.souza@epamig.br') {
      mailOptions.bcc = 'arthur.souza@epamig.br';
    }
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    return false;
  }
}

function formatName(fullName: string): string {
  // Divide o nome em partes
  const nameParts = fullName.toLowerCase().split(' ');
  
  // Se tiver apenas uma parte, retorna ela capitalizada
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
  }
  
  // Pega o primeiro e último nome
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];
  
  // Capitaliza a primeira letra de cada nome
  const formattedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  const formattedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1);
  
  return `${formattedFirstName} ${formattedLastName}`;
}

export function createTaskAssignmentEmail(
  taskTitle: string, 
  taskDescription: string, 
  projectName: string,
  priority: string,
  startDate: string,
  assignedBy: string
) {
  // Formatar a data para o padrão brasileiro
  const formattedDate = new Date(startDate).toLocaleDateString('pt-BR');
  
  // Formatar o nome do criador
  const formattedAssignedBy = formatName(assignedBy);

  return {
    subject: `Nova Tarefa Atribuída`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px; border-radius: 10px;">
        <h2 style="color: #2E7D32; margin-top: 0;">${taskTitle}</h2>
        <p style="color: #666; margin-bottom: 20px;">${taskDescription}</p>
        
        <div style="margin: 15px 0; background-color: white; padding: 15px; border-radius: 8px;">
          <p style="margin: 5px 0;"><strong>Projeto:</strong> ${projectName}</p>
          <p style="margin: 5px 0;"><strong>Prioridade:</strong> ${priority}</p>
          <p style="margin: 5px 0;"><strong>Data de Início:</strong> ${formattedDate}</p>
        </div>

        <div style="margin-top: 20px;">
          <a href="https://gestao.epamigsistema.online/kanban" 
             style="display: inline-block; background-color: #2E7D32; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Acessar o Sistema
          </a>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 20px; font-style: italic;">
          Tarefa criada por ${formattedAssignedBy}
        </p>
        
        <p style="color: #666; font-size: 12px; margin-top: 10px; font-style: italic;">
          Este é um email automático. Por favor, não responda.
        </p>
      </div>
    `
  };
}

export function createTaskNewResponsibleEmail(
  taskTitle: string, 
  taskDescription: string, 
  projectName: string,
  priority: string,
  startDate: string,
  editorName: string
) {
  // Formatar a data para o padrão brasileiro
  const formattedDate = new Date(startDate).toLocaleDateString('pt-BR');
  
  // Formatar o nome do editor
  const formattedEditorName = formatName(editorName);

  return {
    subject: `Você foi adicionado como responsável em uma tarefa`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px; border-radius: 10px;">
        <h2 style="color: #2E7D32; margin-top: 0;">${taskTitle}</h2>
        <p style="color: #666; margin-bottom: 20px;">${taskDescription}</p>
        
        <div style="margin: 15px 0; background-color: white; padding: 15px; border-radius: 8px;">
          <p style="margin: 5px 0;"><strong>Projeto:</strong> ${projectName}</p>
          <p style="margin: 5px 0;"><strong>Prioridade:</strong> ${priority}</p>
          <p style="margin: 5px 0;"><strong>Data de Início:</strong> ${formattedDate}</p>
        </div>

        <div style="margin-top: 20px;">
          <a href="https://gestao.epamigsistema.onlina/kanban" 
             style="display: inline-block; background-color: #2E7D32; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Acessar o Sistema
          </a>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 20px; font-style: italic;">
          Você foi adicionado como responsável por ${formattedEditorName}
        </p>
        
        <p style="color: #666; font-size: 12px; margin-top: 10px; font-style: italic;">
          Este é um email automático. Por favor, não responda.
        </p>
      </div>
    `
  };
} 