
import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormControl,
  ReactiveFormsModule
} from '@angular/forms';

import { timeout } from 'rxjs';

import {
  VentasService,
  type Venta,
  type DetalleVenta,
  type ReporteVenta,
  type RespuestaConsultaPeriodo
} from '../../services/ventas.service';


type TipoReporte = 'dia' | 'mes';


@Component({
  selector: 'app-resumen-ventas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './resumen-ventas.html',
  styleUrl: './resumen-ventas.css'
})
export class ResumenVentas implements OnInit {

  private ventasService = inject(VentasService);

  // BUSCADOR DE TEXTO
  busqueda = new FormControl('', {
    nonNullable: true
  });

  // ESTADOS DE VENTAS
  private ventasEstado = signal<Venta[]>([]);
  private cargandoEstado = signal(false);
  private errorEstado = signal('');

  // ESTADOS DE DETALLE
  private ventaSeleccionadaEstado = signal<Venta | null>(null);
  private detallesEstado = signal<DetalleVenta[]>([]);
  private cargandoDetalleEstado = signal(false);
  private errorDetalleEstado = signal('');

  // ESTADOS DE REPORTES
  private reportesEstado = signal<ReporteVenta[]>([]);
  private tipoReporteEstado = signal<TipoReporte>('dia');
  private tipoSeleccionadoEstado = signal<TipoReporte>('dia');
  private cargandoReporteEstado = signal(false);
  private errorReporteEstado = signal('');

  // ESTADOS DEL BUSCADOR
  private consultaResultadoEstado =
    signal<RespuestaConsultaPeriodo | null>(null);

  private cargandoConsultaEstado = signal(false);
  private errorConsultaEstado = signal('');

  // EVITAR RESPUESTAS ANTIGUAS
  private secuenciaReporte = 0;
  private secuenciaConsulta = 0;


  // PROPIEDADES PARA EL HTML

  get ventas(): Venta[] {
    return this.ventasEstado();
  }

  get cargando(): boolean {
    return this.cargandoEstado();
  }

  get error(): string {
    return this.errorEstado();
  }

  get ventaSeleccionada(): Venta | null {
    return this.ventaSeleccionadaEstado();
  }

  get detalles(): DetalleVenta[] {
    return this.detallesEstado();
  }

  get cargandoDetalle(): boolean {
    return this.cargandoDetalleEstado();
  }

  get errorDetalle(): string {
    return this.errorDetalleEstado();
  }

  get reportes(): ReporteVenta[] {
    return this.reportesEstado();
  }

  get tipoReporte(): TipoReporte {
    return this.tipoReporteEstado();
  }

  get tipoSeleccionado(): TipoReporte {
    return this.tipoSeleccionadoEstado();
  }

  get cargandoReporte(): boolean {
    return this.cargandoReporteEstado();
  }

  get errorReporte(): string {
    return this.errorReporteEstado();
  }

  get consultaResultado(): RespuestaConsultaPeriodo | null {
    return this.consultaResultadoEstado();
  }

  get cargandoConsulta(): boolean {
    return this.cargandoConsultaEstado();
  }

  get errorConsulta(): string {
    return this.errorConsultaEstado();
  }


  // INICIAR COMPONENTE

  ngOnInit(): void {
    this.cargarVentas();
  }


  // CONSULTAR TODAS LAS VENTAS

  cargarVentas(): void {

    this.cargandoEstado.set(true);
    this.errorEstado.set('');

    this.ventasService.obtenerVentas()
      .pipe(timeout(10000))
      .subscribe({

        next: (respuesta) => {

          if (respuesta.exito) {

            this.ventasEstado.set(respuesta.ventas);

            this.cargarReporte(this.tipoSeleccionado);

            if (this.consultaResultado) {
              this.buscarVentas();
            }

          } else {

            this.errorEstado.set(
              'No se pudieron consultar las ventas.'
            );

          }

          this.cargandoEstado.set(false);
        },

        error: () => {

          this.cargandoEstado.set(false);

          this.errorEstado.set(
            'No se pudo conectar con Flask.'
          );

        }

      });
  }


  // CONSULTAR DETALLE DE UN PEDIDO

  verDetalle(idventa: number): void {

    if (this.cargandoDetalle) {
      return;
    }

    this.cargandoDetalleEstado.set(true);
    this.errorDetalleEstado.set('');

    this.ventasService.obtenerDetalleVenta(idventa)
      .pipe(timeout(10000))
      .subscribe({

        next: (respuesta) => {

          if (respuesta.exito) {

            this.ventaSeleccionadaEstado.set(
              respuesta.venta
            );

            this.detallesEstado.set(
              respuesta.detalles
            );

          } else {

            this.errorDetalleEstado.set(
              'No se encontró el pedido.'
            );

          }

          this.cargandoDetalleEstado.set(false);
        },

        error: () => {

          this.cargandoDetalleEstado.set(false);

          this.errorDetalleEstado.set(
            'No se pudo consultar el detalle.'
          );

        }

      });
  }


  cerrarDetalle(): void {

    this.ventaSeleccionadaEstado.set(null);
    this.detallesEstado.set([]);
    this.errorDetalleEstado.set('');

  }


  // NORMALIZAR TEXTO DEL BUSCADOR

  normalizar(texto: string): string {

    return texto
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  }


  // CAMBIAR ENTRE BUSQUEDA POR DIA Y POR MES

  seleccionarTipo(tipo: TipoReporte): void {

    this.tipoSeleccionadoEstado.set(tipo);

    this.busqueda.setValue('');

    this.secuenciaConsulta++;

    this.consultaResultadoEstado.set(null);
    this.errorConsultaEstado.set('');
    this.cargandoConsultaEstado.set(false);

    this.cargarReporte(tipo);
  }


  // REPORTES GENERALES

  cargarReporte(tipo: TipoReporte): void {

    const peticion = ++this.secuenciaReporte;

    this.cargandoReporteEstado.set(true);
    this.errorReporteEstado.set('');

    // Mantener la tabla mientras cambia el reporte

    this.ventasService.obtenerReportes(tipo)
      .pipe(timeout(10000))
      .subscribe({

        next: (respuesta) => {

          if (peticion !== this.secuenciaReporte) {
            return;
          }

          if (respuesta.exito) {

            this.reportesEstado.set(
              respuesta.reportes
            );

            this.tipoReporteEstado.set(tipo);

          } else {

            this.errorReporteEstado.set(
              'No se pudo cargar el reporte.'
            );

          }

          this.cargandoReporteEstado.set(false);
        },

        error: () => {

          if (peticion !== this.secuenciaReporte) {
            return;
          }

          this.cargandoReporteEstado.set(false);

          this.errorReporteEstado.set(
            'No se pudo conectar con Flask.'
          );

        }

      });
  }


  // BUSCADOR DE VENTAS POR DIA O MES

  buscarVentas(): void {

    const tipo = this.tipoSeleccionado;

    const nombre = this.normalizar(
      this.busqueda.value
    );

    const diasValidos = [
      'lunes',
      'martes',
      'miercoles',
      'jueves',
      'viernes',
      'sabado',
      'domingo'
    ];

    const mesesValidos = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre'
    ];

    this.errorConsultaEstado.set('');

    if (!nombre) {

      this.errorConsultaEstado.set(
        tipo === 'dia'
          ? 'Escribe un día de la semana.'
          : 'Escribe el nombre de un mes.'
      );

      return;
    }

    const opciones = tipo === 'dia'
      ? diasValidos
      : mesesValidos;

    if (!opciones.includes(nombre)) {

      this.errorConsultaEstado.set(
        tipo === 'dia'
          ? 'Escribe un día válido, por ejemplo lunes.'
          : 'Escribe un mes válido, por ejemplo noviembre.'
      );

      return;
    }

    const peticion = ++this.secuenciaConsulta;

    this.cargandoConsultaEstado.set(true);

    this.ventasService.consultarPeriodo(tipo, nombre)
      .pipe(timeout(10000))
      .subscribe({

        next: (respuesta) => {

          if (peticion !== this.secuenciaConsulta) {
            return;
          }

          if (respuesta.exito) {

            this.consultaResultadoEstado.set(
              respuesta
            );

          } else {

            this.errorConsultaEstado.set(
              'No se pudieron consultar las ventas.'
            );

          }

          this.cargandoConsultaEstado.set(false);
        },

        error: () => {

          if (peticion !== this.secuenciaConsulta) {
            return;
          }

          this.cargandoConsultaEstado.set(false);

          this.errorConsultaEstado.set(
            'No se pudo completar la consulta.'
          );

        }

      });
  }


  // LIMPIAR EL BUSCADOR

  limpiarBusqueda(): void {

    this.secuenciaConsulta++;

    this.busqueda.setValue('');

    this.consultaResultadoEstado.set(null);
    this.errorConsultaEstado.set('');
    this.cargandoConsultaEstado.set(false);

  }


  // TOTALES

  get totalAcumulado(): number {

    return this.ventas.reduce(
      (total, venta) => total + venta.total,
      0
    );
  }

  get totalReportado(): number {

    return this.reportes.reduce(
      (total, reporte) => total + reporte.total_ventas,
      0
    );
  }

}
