import DomainSchema, { Schema } from '@domain-schema/core';
import DomainValidator, { FieldValidators } from '@domain-schema/validation';
import { FormikProps, withFormik } from 'formik';
import * as React from 'react';
import { ComponentType, CSSProperties, ReactElement } from 'react';

import Field from './FieldAdapter';
import { ButtonsConfig, FieldType, FSF } from './types';

export default class DomainSchemaFormik {
  private static fields: any = {
    custom: {
      name: 'custom'
    }
  };
  private static formComponents: any = {};
  private fields: any = {};
  private formComponents: any = {};
  private configFormik = {
    enableReinitialize: true,
    mapPropsToValues: () => this.getValuesFromSchema(),
    handleSubmit(values, { props: { onSubmit }, ...formikBag }) {
      onSubmit(values, formikBag);
    },
    validate: (values: any) => this.validate(values)
  };

  constructor(private schema: Schema) {
    this.schema = new DomainSchema(schema);
  }

  public validate(formValues: any) {
    return DomainValidator.validate(this.schema, formValues);
  }

  public generateFields({ values }: FormikProps<any>) {
    const formElements = this.generateFieldComponents(values, this.schema.values, null, []);
    return <React.Fragment>{formElements}</React.Fragment>;
  }

  public generateForm(buttonsConfig?: ButtonsConfig | any, formAttrs?: any) {
    return withFormik(this.configFormik)(({ values, isValid, handleReset, handleSubmit }: FormikProps<any>) => {
      const formElements = this.generateFieldComponents(values, this.schema.values, null, []);
      formElements.push(this.genButtons(buttonsConfig || {}, isValid, handleReset));
      const Form =
        (this.formComponents.form && this.formComponents.form.component) ||
        (DomainSchemaFormik.formComponents.form && DomainSchemaFormik.formComponents.form.component);
      return (
        <Form handleSubmit={handleSubmit} name={this.schema.name} input={formAttrs}>
          {formElements}
        </Form>
      );
    });
  }

  public setFormComponents(components: any) {
    Object.keys(components).forEach(fieldType => {
      if (fieldType === 'form' || fieldType === 'button') {
        this.formComponents[fieldType] = DomainSchemaFormik.getFieldType(fieldType, components);
      } else {
        this.fields[fieldType] = DomainSchemaFormik.getFieldType(fieldType, components);
      }
    });
    this.fields.custom = {
      name: 'custom'
    };
  }

  public static setFormComponents(components: any) {
    Object.keys(components).forEach(fieldType => {
      if (fieldType === 'form' || fieldType === 'button') {
        DomainSchemaFormik.formComponents[fieldType] = DomainSchemaFormik.getFieldType(fieldType, components);
      } else {
        DomainSchemaFormik.fields[fieldType] = DomainSchemaFormik.getFieldType(fieldType, components);
      }
    });
  }

  public getValuesFromSchema() {
    const getValues = (schema: Schema, model: any) => {
      Object.keys(schema)
        .filter(schemaProp => schema.hasOwnProperty(schemaProp))
        .forEach((fieldName: string) => {
          if (fieldName === 'id' || schema[fieldName].ignore) {
            return;
          }
          const schemaField = schema[fieldName];
          model[fieldName] = schemaField.type.isSchema
            ? getValues(schema[fieldName].type.values, {})
            : schemaField.defaultValue || '';
        });
      return model;
    };
    return getValues(this.schema.values, {});
  }

  private static getFieldType = (fieldType: string, components: any) => ({
    name: fieldType,
    component: components[fieldType]
  });

  private generateFieldComponents(values: any, schema: DomainSchema, parent: string, collector: any[]) {
    Object.keys(schema)
      .filter(schemaProp => schema.hasOwnProperty(schemaProp))
      .forEach((fieldName: string) => {
        if (fieldName === 'id' || schema[fieldName].ignore) {
          return;
        }
        const schemaField: FSF = schema[fieldName];
        schemaField.fieldType = schemaField.fieldType || 'input';
        if (!schemaField.type.isSchema) {
          const fieldValue = parent ? values[parent][fieldName] : values[fieldName];
          if (
            (this.fields && this.fields.hasOwnProperty(schemaField.fieldType)) ||
            DomainSchemaFormik.fields.hasOwnProperty(schemaField.fieldType)
          ) {
            collector.push(
              this.genField(
                (this.fields && this.fields[schemaField.fieldType]) || DomainSchemaFormik.fields[schemaField.fieldType],
                schemaField,
                fieldValue,
                fieldName,
                {
                  name: parent,
                  value: values[parent]
                }
              )
            );
          } else {
            throw new Error(`${fieldName} has wrong field type`);
          }
        } else {
          this.generateFieldComponents(values, schema[fieldName].type.values, fieldName, collector);
        }
      });
    return collector;
  }

  private genField(
    fieldType: FieldType,
    schemaField: FSF,
    value: string | number | boolean,
    fieldName: string,
    parent?: any
  ) {
    const props = {
      key: fieldName,
      name: fieldName,
      attrs: schemaField.input,
      fieldType: fieldType.name,
      component: fieldType.component || schemaField.component,
      parent,
      value
    };
    return <Field {...props} />;
  }

  private genButtons(buttonsConfig: ButtonsConfig | any, valid: boolean, handleReset: () => void): ReactElement<any> {
    let { submit } = buttonsConfig;
    const { reset } = buttonsConfig;
    if (!submit) {
      if (Object.keys(buttonsConfig).length) {
        submit = buttonsConfig;
      } else {
        submit = {
          label: 'Save',
          disableOnInvalid: true
        };
      }
    }
    if (!submit.hasOwnProperty('disableOnInvalid')) {
      submit.disableOnInvalid = true;
    }
    const { label, disableOnInvalid, ...submitProps } = submit;
    if (disableOnInvalid) {
      submitProps.disabled = !valid;
    }

    const styles: CSSProperties = {
      display: 'flex',
      flex: 1,
      justifyContent: reset
        ? (submitProps.align === 'left' && reset.align !== 'right') || (reset.align === 'left' && !submitProps.align)
          ? 'flex-start'
          : (submitProps.align === 'right' && reset.align !== 'left') || (reset.align === 'right' && !submitProps.align)
            ? 'flex-end'
            : (submitProps.align === 'right' && reset.align === 'left') ||
              (reset.align === 'right' && submitProps.align === 'left')
              ? 'space-between'
              : 'center'
        : submitProps.align === 'left' ? 'flex-start' : submitProps.align === 'right' ? 'flex-end' : 'center'
    };
    const Button =
      (this.formComponents.button && this.formComponents.button.component) ||
      (DomainSchemaFormik.formComponents.button && DomainSchemaFormik.formComponents.button.component);
    return (
      <div key="formButtons" style={styles}>
        {submit && (
          <Button type="submit" {...submitProps}>
            {label}
          </Button>
        )}
        {reset && (
          <Button type="reset" {...reset} onClick={handleReset}>
            {reset.label}
          </Button>
        )}
      </div>
    );
  }
}
