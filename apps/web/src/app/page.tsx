import { redirect } from 'next/navigation';

/**
 * Rota raiz vira apenas um redirecionamento — as telas reais moraram para o
 * grupo (app), com a casca do protótipo do Stitch. O middleware já garante
 * sessão antes de chegar aqui.
 */
export default function RootPage() {
  redirect('/dashboard');
}
