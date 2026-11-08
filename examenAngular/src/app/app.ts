
import {
  Component,
  ViewChild,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { HttpErrorResponse } from '@angular/common/http';
import { timeout } from 'rxjs';

import {
  FormularioPedido
} from './components/formulario-pedido/formulario-pedido';

import type {
  PizzaPedido
} from './components/formulario-pedido/formulario-pedido';

import {
  DetallePedido
} from './components/detalle-pedido/detalle-pedido';

import {
  ResumenVentas
} from './components/resumen-ventas/resumen-ventas';

import {
  VentasService
} from './services/ventas.service';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    FormularioPedido,
    DetallePedido,
    ResumenVentas
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  @ViewChild(FormularioPedido)
  formularioPedido?: FormularioPedido;

  @ViewChild(ResumenVentas)
  resumenVentas?: ResumenVentas;

  private ventasService = inject(VentasService);
  private detector = inject(ChangeDetectorRef);

  pizzas: PizzaPedido[] = [];

  guardando = false;
  mensaje = '';
  error = '';


  // AGREGAR PIZZA
  agregarPizza(pizza: PizzaPedido): void {

    this.pizzas = [...this.pizzas, pizza];

    this.mensaje = '';
    this.error = '';
  }


  // QUITAR PIZZA
  quitarPizza(indice: number): void {

    if (this.guardando) {
      return;
    }

    this.pizzas = this.pizzas.filter(
      (_, i) => i !== indice
    );
  }


  // TERMINAR PEDIDO
  terminarPedido(): void {

    if (this.guardando) {
      return;
    }

    this.mensaje = '';
    this.error = '';

    if (this.pizzas.length === 0) {
      this.error = 'Debes agregar al menos una pizza.';
      return;
    }

    const cliente = this.formularioPedido?.obtenerDatosCliente();

    if (!cliente) {
      this.error = 'Completa correctamente los datos del cliente.';
      return;
    }

    this.guardando = true;

    this.ventasService.registrarVenta(
      cliente,
      this.pizzas
    )
    .pipe(timeout(15000))
    .subscribe({

      next: (respuesta) => {

        this.guardando = false;

        if (respuesta.exito) {

          // Mostrar confirmación enviada por Flask Flash
          this.mensaje = respuesta.mensaje;

          // Vaciar las pizzas registradas
          this.pizzas = [];

          // Limpiar datos del cliente
          const formulario = this.formularioPedido;

          if (formulario) {

            formulario.formulario.patchValue({
              nombre_cliente: '',
              direccion: '',
              telefono: '',
              fecha_pedido: formulario.obtenerFechaHoy()
            });

            formulario.formulario.markAsPristine();
            formulario.formulario.markAsUntouched();
          }

          // Actualizar ventas y reportes
          this.resumenVentas?.cargarVentas();

        } else {

          this.error = respuesta.mensaje;
        }

        this.detector.markForCheck();
      },

      error: (err: HttpErrorResponse) => {

        this.guardando = false;

        this.error = err.error?.mensaje ||
          'No se pudo confirmar el pedido. ' +
          'Consulta las ventas antes de volver a intentarlo.';

        this.detector.markForCheck();
      }

    });
  }

}
