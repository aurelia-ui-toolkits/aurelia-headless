import { IContainer, IFactory, Constructable, Transformer, Key } from '@aurelia/kernel';
import { IValidationController, ValidationController } from '@aurelia/validation-html';
import { UiValidationResultPresenter } from './ui-validation-result-presenter';

export class UiValidationControllerFactory implements IFactory<Constructable<IValidationController>> {
  public Type: Constructable<IValidationController> = (void 0)!;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public registerTransformer(_transformer: Transformer<Constructable<IValidationController>>): boolean {
    return false;
  }

  public construct(_: IContainer, _dynamicDependencies?: Key[] | undefined): IValidationController {
    const controller: IValidationController = _dynamicDependencies !== void 0
      ? Reflect.construct(ValidationController, _dynamicDependencies)
      : new ValidationController();
    controller.addSubscriber(new UiValidationResultPresenter());
    return controller;
  }
}
