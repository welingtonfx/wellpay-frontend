import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { PagamentoComponent } from './pages/pagamento/pagamento.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'pagamento', component: PagamentoComponent },
  { path: '**', redirectTo: '' }
];
