
import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { CommonModule } from '@angular/common';

import type {
  PizzaPedido
} from '../formulario-pedido/formulario-pedido';

@Component({
  selector: 'app-detalle-pedido',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-pedido.html',
  styleUrl: './detalle-pedido.css'
})
export class DetallePedido {

  // Pizzas que se agregan al pedido
  @Input() pizzas: PizzaPedido[] = [];

  // Estado del registro de la venta
  @Input() guardando = false;
  @Input() mensaje = '';
  @Input() error = '';

  // Eventos enviados al componente principal
  @Output() quitar = new EventEmitter<number>();
  @Output() terminar = new EventEmitter<void>();

  // Calcular el total del pedido
  get total(): number {
    return this.pizzas.reduce(
      (acumulado, pizza) => acumulado + pizza.subtotal,
      0
    );
  }

  // Quitar una pizza de la tabla
  quitarPizza(indice: number): void {
    this.quitar.emit(indice);
  }

  // Solicitar que se registre el pedido
  terminarPedido(): void {
    this.terminar.emit();
  }

  // Mostrar los nombres de los ingredientes
  mostrarIngredientes(ingredientes: string[]): string {

    if (ingredientes.length === 0) {
      return 'Sin ingredientes adicionales';
    }

    const nombres: Record<string, string> = {
      jamon: 'Jamón',
      pina: 'Piña',
      champinones: 'Champiñones'
    };

    return ingredientes
      .map(ingrediente => nombres[ingrediente] || ingrediente)
      .join(', ');
  }

}
