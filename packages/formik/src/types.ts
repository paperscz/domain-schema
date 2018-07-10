import { FieldValidators } from '@domain-schema/validation';
import { ComponentType } from 'react';

export interface SchemaField {
  type: any;
  fieldType: string;
  input?: any;
  defaultValue?: string | boolean | number;
  component?: ComponentType<any>;
}

export type FSF = SchemaField & FieldValidators; // Full Schema Field

export interface RenderComponentProps {
  input?: any;
  meta?: any;
  children?: any[];
  options?: any;
}

export interface FormFieldType {
  name: string;
  component?: ComponentType<any>;
}

export interface ButtonsConfig {
  submit: any;
  reset?: any;
}
