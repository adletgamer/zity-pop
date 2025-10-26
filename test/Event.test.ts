import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ZITY.POP - Event System", function () {
  let eventFactory: any;
  let event: any;
  let owner: HardhatEthersSigner;
  let organizer: HardhatEthersSigner;
  let buyer1: HardhatEthersSigner;
  let buyer2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, organizer, buyer1, buyer2] = await ethers.getSigners();

    // Deploy EventFactory
    const EventFactory = await ethers.getContractFactory("EventFactory");
    eventFactory = await EventFactory.deploy();
    await eventFactory.waitForDeployment();
  });

  describe("EventFactory", function () {
    it("Debería deployar correctamente", async function () {
      expect(await eventFactory.totalEvents()).to.equal(0);
      expect(await eventFactory.owner()).to.equal(owner.address);
    });

    it("Debería crear un nuevo evento", async function () {
      const tx = await eventFactory.connect(organizer).createEvent(
        "Festival Cultural ZITY",
        "FESTZITY",
        ethers.parseEther("0.01"), // ticketPrice
        100, // maxTickets
        ethers.parseEther("0.5"), // minGoal
        ethers.parseEther("2"), // maxGoal
        "https://api.zity.pop/metadata/" // baseTokenURI
      );

      // Verificar que se emitió el evento
      await expect(tx)
        .to.emit(eventFactory, "EventCreated");

      // Verificar contador de eventos
      expect(await eventFactory.totalEvents()).to.equal(1);
      
      // Verificar eventos del organizador
      const organizerEvents = await eventFactory.getOrganizerEvents(organizer.address);
      expect(organizerEvents.length).to.equal(1);
      
      // Verificar dirección del evento creado
      const eventAddress = await eventFactory.getEventAddress(0);
      expect(eventAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Debería permitir múltiples eventos por organizador", async function () {
      // Crear primer evento
      await eventFactory.connect(organizer).createEvent(
        "Evento 1",
        "EV1",
        ethers.parseEther("0.01"),
        50,
        ethers.parseEther("0.2"),
        ethers.parseEther("1"),
        "https://api.zity.pop/metadata/"
      );

      // Crear segundo evento
      await eventFactory.connect(organizer).createEvent(
        "Evento 2", 
        "EV2",
        ethers.parseEther("0.02"),
        100,
        ethers.parseEther("0.5"),
        ethers.parseEther("2"),
        "https://api.zity.pop/metadata/"
      );

      expect(await eventFactory.totalEvents()).to.equal(2);
      
      const organizerEvents = await eventFactory.getOrganizerEvents(organizer.address);
      expect(organizerEvents.length).to.equal(2);
    });
  });

  describe("Event Contract", function () {
    let eventAddress: string;

    beforeEach(async function () {
      // Crear un evento para testing
      const tx = await eventFactory.connect(organizer).createEvent(
        "Concierto de Prueba",
        "TEST",
        ethers.parseEther("0.01"),
        10,
        ethers.parseEther("0.1"),
        ethers.parseEther("0.5"),
        "https://api.zity.pop/metadata/"
      );

      // Obtener la dirección del evento creado
      eventAddress = await eventFactory.getEventAddress(0);
      const EventContract = await ethers.getContractFactory("Event");
      event = EventContract.attach(eventAddress);
    });

    it("Debería inicializar con parámetros correctos", async function () {
      const details = await event.getEventDetails();
      
      expect(details[0]).to.equal("Concierto de Prueba"); // name
      expect(details[1]).to.equal("TEST"); // symbol
      expect(details[2]).to.equal(ethers.parseEther("0.01")); // ticketPrice
      expect(details[3]).to.equal(10); // maxTickets
      expect(details[4]).to.equal(0); // ticketsSold
      expect(details[7]).to.equal(true); // isActive
    });

    it("Debería permitir comprar tickets", async function () {
      const ticketPrice = await event.ticketPrice();
      
      // Comprar ticket
      await expect(
        event.connect(buyer1).purchaseTicket({ value: ticketPrice })
      )
        .to.emit(event, "TicketPurchased")
        .withArgs(buyer1.address, ticketPrice);

      // Verificar estado
      expect(await event.ticketsSold()).to.equal(1);
      expect(await event.fundsRaised()).to.equal(ticketPrice);
      expect(await event.hasPurchased(buyer1.address)).to.equal(true);
      
      // Verificar balance NFT
      expect(await event.balanceOf(buyer1.address, 1)).to.equal(1);
    });

    it("Debería rechazar compra con pago insuficiente", async function () {
      const ticketPrice = await event.ticketPrice();
      
      await expect(
        event.connect(buyer1).purchaseTicket({ value: ticketPrice / 2n })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Debería rechazar compra si ya se compró", async function () {
      const ticketPrice = await event.ticketPrice();
      
      // Primera compra exitosa
      await event.connect(buyer1).purchaseTicket({ value: ticketPrice });
      
      // Segunda compra debería fallar
      await expect(
        event.connect(buyer1).purchaseTicket({ value: ticketPrice })
      ).to.be.revertedWith("Already purchased");
    });

    it("Debería liberar fondos cuando se alcanza la meta", async function () {
      const ticketPrice = await event.ticketPrice();
      const minGoal = await event.minGoal();
      
      // Comprar suficientes tickets para alcanzar la meta mínima
      const ticketsNeeded = Math.ceil(Number(ethers.formatEther(minGoal)) / Number(ethers.formatEther(ticketPrice)));
      
      for (let i = 0; i < ticketsNeeded; i++) {
        const buyer = i === 0 ? buyer1 : buyer2;
        await event.connect(buyer).purchaseTicket({ value: ticketPrice });
      }

      // Liberar fondos
      await expect(event.connect(organizer).releaseFunds())
        .to.emit(event, "FundsReleased");

      expect(await event.fundsReleased()).to.equal(true);
    });

    it("Debería permitir reembolsos si no se alcanza la meta", async function () {
      const ticketPrice = await event.ticketPrice();
      
      // Comprar ticket
      await event.connect(buyer1).purchaseTicket({ value: ticketPrice });
      
      // Desactivar evento
      await event.connect(organizer).deactivateEvent();
      
      // Solicitar reembolso
      await expect(event.connect(buyer1).refund())
        .to.emit(event, "RefundIssued")
        .withArgs(buyer1.address, ticketPrice);

      expect(await event.hasPurchased(buyer1.address)).to.equal(false);
    });
  });
});