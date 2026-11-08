
import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';

export interface PizzaPedido {
  tamano: 'chica' | 'mediana' | 'grande';
  ingredientes: string[];
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface DatosCliente {
  nombre_cliente: string;
  direccion: string;
  telefono: string;
  fecha_pedido: string;
}

type TamanoPizza = 'chica' | 'mediana' | 'grande';

@Component({
  selector: 'app-formulario-pedido',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './formulario-pedido.html',
  styleUrl: './formulario-pedido.css'
})
export class FormularioPedido {

  @Output() pizzaAgregada = new EventEmitter<PizzaPedido>();

  error = '';

  precios: Record<TamanoPizza, number> = {
    chica: 40,
    mediana: 80,
    grande: 120
  };

  formulario = new FormGroup({

    nombre_cliente: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)]
    }),

    direccion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(255)]
    }),

    telefono: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(7),
        Validators.maxLength(25)
      ]
    }),

    fecha_pedido: new FormControl(this.obtenerFechaHoy(), {
      nonNullable: true,
      validators: [Validators.required]
    }),

    tamano: new FormControl<TamanoPizza>('mediana', {
      nonNullable: true,
      validators: [Validators.required]
    }),

    ingredientes: new FormGroup({
      jamon: new FormControl(false, { nonNullable: true }),
      pina: new FormControl(false, { nonNullable: true }),
      champinones: new FormControl(false, { nonNullable: true })
    }),

    cantidad: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)]
    })

  });

  obtenerFechaHoy(): string {
    const hoy = new Date();

    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  obtenerIngredientes(): string[] {
    const seleccion = this.formulario.controls.ingredientes.getRawValue();
    const ingredientes: string[] = [];

    if (seleccion.jamon) ingredientes.push('jamon');
    if (seleccion.pina) ingredientes.push('pina');
    if (seleccion.champinones) ingredientes.push('champinones');

    return ingredientes;
  }

  get precioUnitario(): number {
    const tamano = this.formulario.controls.tamano.value;

    const precioBase = this.precios[tamano];
    const precioExtras = this.obtenerIngredientes().length * 10;

    return precioBase + precioExtras;
  }

  get subtotal(): number {
    const cantidad = this.formulario.controls.cantidad.value;

    if (!Number.isInteger(cantidad) || cantidad < 1) {
      return 0;
    }

    return this.precioUnitario * cantidad;
  }

  obtenerDatosCliente(): DatosCliente | null {
    const f = this.formulario.controls;

    if (
      f.nombre_cliente.invalid ||
      f.direccion.invalid ||
      f.telefono.invalid ||
      f.fecha_pedido.invalid
    ) {
      this.formulario.markAllAsTouched();
      return null;
    }

    return {
      nombre_cliente: f.nombre_cliente.value.trim(),
      direccion: f.direccion.value.trim(),
      telefono: f.telefono.value.trim(),
      fecha_pedido: f.fecha_pedido.value
    };
  }

  agregarPizza(): void {
    this.error = '';

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.error = 'Completa correctamente los campos obligatorios.';
      return;
    }

    const cantidad = this.formulario.controls.cantidad.value;

    if (!Number.isInteger(cantidad) || cantidad < 1) {
      this.error = 'La cantidad debe ser un número entero mayor que cero.';
      return;
    }

    const pizza: PizzaPedido = {
      tamano: this.formulario.controls.tamano.value,
      ingredientes: this.obtenerIngredientes(),
      cantidad: cantidad,
      precio_unitario: this.precioUnitario,
      subtotal: this.subtotal
    };

    this.pizzaAgregada.emit(pizza);

    // Limpiar solo la selección de pizzas,
    // conservando los datos del cliente.
    this.formulario.patchValue({
      tamano: 'mediana',
      cantidad: 1,
      ingredientes: {
        jamon: false,
        pina: false,
        champinones: false
      }
    });
  }

}
