import { Controller, Get } from "@nestjs/common";
import { HealthService } from './health.service.js'

@Controller('health')
export class HealthController {
    constructor(private readonly healtService: HealthService) {}

    @Get()
    check() {
        return this.healtService.check();
    }
}
