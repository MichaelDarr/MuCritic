import { RymDatabaseEntities } from '../../entities/entities';
import { Aggregation } from '../types';

export abstract class Aggregator<T1 extends RymDatabaseEntities, T2 extends Aggregation> {
    public entity: T1;

    public constructor(entity: T1) {
        this.entity = entity;
    }

    public async aggregate(normalized = true): Promise<T2> {
        let aggregation = await this.generateAggregate(normalized);
        if(normalized) aggregation = this.normalize(aggregation);
        return aggregation;
    }

    protected abstract async generateAggregate(normalized: boolean): Promise<T2>;

    protected abstract normalize(aggregation: T2): T2;
}
